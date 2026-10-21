import pool from "../config/db.js";
import logger from "../config/logger.js";

export async function releaseExpiredOrders() {
  const [orders] = await pool.execute(
    `
      SELECT id, tenant_id
      FROM orders
      WHERE status = 'PENDING'
        AND payment_expires_at <= UTC_TIMESTAMP()
      ORDER BY payment_expires_at, id
      LIMIT 50
    `
  );

  let processed = 0;

  for (const candidate of orders) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Lock and recheck the order.
      const [lockedOrders] = await connection.execute(
        `
          SELECT id, tenant_id, status, payment_expires_at
          FROM orders
          WHERE id = ?
            AND tenant_id = ?
          FOR UPDATE
        `,
        [candidate.id, candidate.tenant_id]
      );

      const order = lockedOrders[0];

      if (
        !order ||
        order.status !== "PENDING" ||
        !order.payment_expires_at ||
        new Date(order.payment_expires_at) > new Date()
      ) {
        await connection.rollback();
        continue;
      }

      // Lock associated order items and inventory rows.
      const [items] = await connection.execute(
        `
          SELECT
            oi.product_id,
            oi.quantity
          FROM order_items oi
          WHERE oi.order_id = ?
          ORDER BY oi.product_id
        `,
        [order.id]
      );

      for (const item of items) {
        const [inventoryRows] = await connection.execute(
          `
            SELECT id, reserved_qty
            FROM inventory
            WHERE tenant_id = ?
              AND product_id = ?
            FOR UPDATE
          `,
          [order.tenant_id, item.product_id]
        );

        const inventory = inventoryRows[0];

        if (!inventory || inventory.reserved_qty < item.quantity) {
          throw new Error(
            `Inventory reservation inconsistency for order ${order.id}`
          );
        }

        await connection.execute(
          `
            UPDATE inventory
            SET reserved_qty = reserved_qty - ?,
                updated_at = UTC_TIMESTAMP()
            WHERE tenant_id = ?
              AND product_id = ?
              AND reserved_qty >= ?
          `,
          [
            item.quantity,
            order.tenant_id,
            item.product_id,
            item.quantity
          ]
        );
      }

      // Change status only if the order remains pending.
      const [updateResult] = await connection.execute(
        `
          UPDATE orders
          SET status = 'CANCELLED'
          WHERE id = ?
            AND tenant_id = ?
            AND status = 'PENDING'
        `,
        [order.id, order.tenant_id]
      );

      if (updateResult.affectedRows !== 1) {
        throw new Error(
          `Could not cancel expired order ${order.id}`
        );
      }

      await connection.commit();

      processed += 1;

      logger.info(
        {
          orderId: order.id,
          tenantId: order.tenant_id
        },
        "Expired order cancelled and reservation released"
      );
    } catch (error) {
      await connection.rollback();

      logger.error(
        {
          err: error,
          orderId: candidate.id,
          tenantId: candidate.tenant_id
        },
        "Failed to release expired order"
      );
    } finally {
      connection.release();
    }
  }

  return processed;
}