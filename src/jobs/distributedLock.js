import pool from "../config/db.js";

export async function acquireJobLock(jobName, leaseSeconds = 300) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    await connection.execute(
      `
        INSERT INTO job_locks (job_name, locked_until)
        VALUES (?, UTC_TIMESTAMP())
        ON DUPLICATE KEY UPDATE job_name = VALUES(job_name)
      `,
      [jobName]
    );

    const [rows] = await connection.execute(
      `
        SELECT locked_until
        FROM job_locks
        WHERE job_name = ?
        FOR UPDATE
      `,
      [jobName]
    );

    const [result] = await connection.execute(
      `
        UPDATE job_locks
        SET locked_until =
          DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? SECOND)
        WHERE job_name = ?
          AND locked_until <= UTC_TIMESTAMP()
      `,
      [leaseSeconds, jobName]
    );

    if (result.affectedRows !== 1) {
      await connection.rollback();
      return false;
    }

    await connection.commit();

    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function releaseJobLock(jobName) {
  await pool.execute(
    `
      UPDATE job_locks
      SET locked_until = UTC_TIMESTAMP()
      WHERE job_name = ?
    `,
    [jobName]
  );
}