import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS);

const ACCESS_EXPIRES_IN =
  process.env.JWT_ACCESS_EXPIRES_IN || "15m";

const REFRESH_EXPIRES_IN =
  process.env.JWT_REFRESH_EXPIRES_IN || "7d";

export async function registerUser({
  tenantId,
  email,
  password,
  role = "user"
}) {
  const passwordHash = await bcrypt.hash(
    password,
    BCRYPT_ROUNDS
  );

  const [result] = await pool.query(
    `
      INSERT INTO users
        (tenant_id, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `,
    [tenantId, email, passwordHash, role]
  );

  return {
    id: result.insertId,
    tenantId,
    email,
    role
  };
}

export async function loginUser({
  tenantId,
  email,
  password
}) {
  const [rows] = await pool.query(
    `
      SELECT
        id,
        tenant_id,
        email,
        password_hash,
        role
      FROM users
      WHERE tenant_id = ?
        AND email = ?
      LIMIT 1
    `,
    [tenantId, email]
  );

  if (rows.length === 0) {
    return null;
  }

  const user = rows[0];

  const passwordMatches = await bcrypt.compare(
    password,
    user.password_hash
  );

  if (!passwordMatches) {
    return null;
  }

  const payload = {
    userId: user.id,
    tenantId: user.tenant_id,
    role: user.role
  };

  const accessToken = jwt.sign(
    payload,
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: ACCESS_EXPIRES_IN
    }
  );

  const refreshToken = jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: REFRESH_EXPIRES_IN
    }
  );

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      tenantId: user.tenant_id,
      email: user.email,
      role: user.role
    }
  };
}