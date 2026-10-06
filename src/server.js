import express from "express";
import dotenv from "dotenv";
import pool from "./config/db.js";

import productRoutes from "./routes/productRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import { errorMiddleware } from "./middleware/errorMiddleware.js";
import cookieParser from "cookie-parser";

import pinoHttp from "pino-http";
import logger from "./config/logger.js";


dotenv.config();

const app = express();

const PORT = process.env.PORT;
const NODE_ENV = process.env.NODE_ENV;
app.use(pinoHttp({
  logger
}));
app.use(express.json());
app.use(cookieParser());

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString()
  });
});

app.get("/health/db", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.json({
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      status: "error",
      database: "disconnected"
    });
  }
});

app.use("/api/auth", authRoutes);

app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);


app.use(errorMiddleware);

// app.listen(PORT, () => {
//   logger.info(`Server running on port ${PORT}`);
//   console.log(`Environment: ${NODE_ENV}`);
// });
const server = app.listen(PORT, () => {
  logger.info({ port: PORT }, "Server started");
});

async function gracefulShutdown(signal) {
  logger.info({ signal }, "Shutdown started");

  server.close(async () => {
    logger.info("HTTP server closed");

    try {
      await pool.end();

      logger.info("Database pool closed");

      process.exit(0);
    } catch (error) {
      logger.error({ err: error }, "Error while closing database pool");
      process.exit(1);
    }
  });
}

process.on("SIGTERM", () => {
  gracefulShutdown("SIGTERM");
});

process.on("SIGINT", () => {
  gracefulShutdown("SIGINT");
});