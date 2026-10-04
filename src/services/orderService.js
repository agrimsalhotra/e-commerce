import pool from "../config/db.js";
import { AppError } from "../utils/AppError.js";

export async function checkoutService({
  tenantId,
  userId,
  productId,
  quantity
}) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Lock the inventory row
    const [inventoryRows] = await connection.query(
      `
        SELECT
          id,
          product_id,
          stock_qty,
          reserved_qty
        FROM inventory
        WHERE tenant_id = ?
          AND product_id = ?
        FOR UPDATE
      `,
      [tenantId, productId]
    );

    if (inventoryRows.length === 0) {
      throw new AppError(
        "Inventory not found",
        404
      );
    }

    const inventory = inventoryRows[0];

    // 2. Calculate available stock
    const available =
      inventory.stock_qty -
      inventory.reserved_qty;

    if (available < quantity) {
      throw new AppError("Insufficient inventory",409);
    }

    // 3. Get product price
    const [productRows] = await connection.query(
      `
        SELECT id, price
        FROM products
        WHERE tenant_id = ?
          AND id = ?
        FOR UPDATE
      `,
      [tenantId, productId]
    );

    if (productRows.length === 0) {
      throw new AppError("Product not found",404);
    }

    const product = productRows[0];

    // 4. Calculate order total
    const totalAmount =
      Number(product.price) * quantity;

    // 5. Create order
    const [orderResult] = await connection.query(
      `
        INSERT INTO orders
          (
            tenant_id,
            user_id,
            status,
            total_amount
          )
        VALUES (?, ?, ?, ?)
      `,
      [
        tenantId,
        userId,
        "PENDING",
        totalAmount
      ]
    );

    const orderId = orderResult.insertId;

    // 6. Create order item
    await connection.query(
      `
        INSERT INTO order_items
          (
            order_id,
            product_id,
            quantity,
            unit_price
          )
        VALUES (?, ?, ?, ?)
      `,
      [
        orderId,
        productId,
        quantity,
        product.price
      ]
    );

    // 7. Reserve inventory
    await connection.query(
      `
        UPDATE inventory
        SET reserved_qty = reserved_qty + ?
        WHERE tenant_id = ?
          AND product_id = ?
      `,
      [
        quantity,
        tenantId,
        productId
      ]
    );

    // 8. Commit everything
    await connection.commit();

    return {
      orderId,
      tenantId,
      userId,
      productId,
      quantity,
      unitPrice: product.price,
      totalAmount,
      status: "PENDING"
    };

  } catch (error) {

    await connection.rollback();

    throw error;

  } finally {

    connection.release();

  }
}