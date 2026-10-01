import pool from "../config/db.js";

export async function createProduct(tenantId, data) {
  const [result] = await pool.query(
    `
      INSERT INTO products
        (tenant_id, name, price)
      VALUES (?, ?, ?)
    `,
    [tenantId, data.name, data.price]
  );

  const [rows] = await pool.query(
    `
      SELECT id, tenant_id, name, price, created_at
      FROM products
      WHERE tenant_id = ?
        AND id = ?
    `,
    [tenantId, result.insertId]
  );

  return rows[0];
}

export async function getProducts(tenantId, limit, offset) {
  const [rows] = await pool.query(
    `
      SELECT id, tenant_id, name, price, created_at
      FROM products
      WHERE tenant_id = ?
      ORDER BY id
      LIMIT ? OFFSET ?
    `,
    [tenantId, limit, offset]
  );

  return rows;
}

export async function getProductById(tenantId, productId) {
  const [rows] = await pool.query(
    `
      SELECT id, tenant_id, name, price, created_at
      FROM products
      WHERE tenant_id = ?
        AND id = ?
    `,
    [tenantId, productId]
  );

  return rows[0] ?? null;
}

export async function updateProduct(
  tenantId,
  productId,
  data
) {
  const [result] = await pool.query(
    `
      UPDATE products
      SET name = ?, price = ?
      WHERE tenant_id = ?
        AND id = ?
    `,
    [
      data.name,
      data.price,
      tenantId,
      productId
    ]
  );

  if (result.affectedRows === 0) {
    return null;
  }

  return getProductById(tenantId, productId);
}

export async function patchProduct(
  tenantId,
  productId,
  data
) {
  const fields = [];
  const values = [];

  if (data.name !== undefined) {
    fields.push("name = ?");
    values.push(data.name);
  }

  if (data.price !== undefined) {
    fields.push("price = ?");
    values.push(data.price);
  }

  if (fields.length === 0) {
    return getProductById(tenantId, productId);
  }

  values.push(tenantId, productId);

  const [result] = await pool.query(
    `
      UPDATE products
      SET ${fields.join(", ")}
      WHERE tenant_id = ?
        AND id = ?
    `,
    values
  );

  if (result.affectedRows === 0) {
    return null;
  }

  return getProductById(tenantId, productId);
}

export async function deleteProduct(
  tenantId,
  productId
) {
  const [result] = await pool.query(
    `
      DELETE FROM products
      WHERE tenant_id = ?
        AND id = ?
    `,
    [tenantId, productId]
  );

  return result.affectedRows > 0;
}