import express from "express";
import dotenv from "dotenv";
import http from "node:http";
import pool from "./config/db.js";

import productRoutes from "./routes/productRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import { errorMiddleware } from "./middleware/errorMiddleware.js";
import cookieParser from "cookie-parser";

import pinoHttp from "pino-http";
import logger from "./config/logger.js";

import { registerOrderListeners } from "./events/registerOrderListeners.js";
import {
  initializeSocket,
  closeSocketServer
} from "./realtime/socket.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

app.use(
  pinoHttp({
    logger
  })
);

app.use(express.json());
app.use(cookieParser());

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString()
  });
});

// Database health check
app.get("/health/db", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.json({
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error({ err: error }, "Database health check failed");

    res.status(500).json({
      status: "error",
      database: "disconnected"
    });
  }
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

// Centralized error middleware should remain after the routes.
app.use(errorMiddleware);

// Create one HTTP server for Express and Socket.IO.
const server = http.createServer(app);

// Initialize WebSockets on the same HTTP server.
initializeSocket(server);

// Register Step 8 event listeners exactly once.
registerOrderListeners();

// Start the server.
server.listen(PORT, () => {
  logger.info(
    {
      port: PORT,
      environment: NODE_ENV
    },
    "HTTP and WebSocket server started"
  );
});

// Graceful shutdown
let isShuttingDown = false;

async function gracefulShutdown(signal) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  logger.info({ signal }, "Shutdown started");

  // Stop accepting new HTTP connections.
  server.close(async (serverError) => {
    if (serverError) {
      logger.error(
        { err: serverError },
        "Error while closing HTTP server"
      );
    }

    logger.info("HTTP server closed");

    try {
      await closeSocketServer();
      logger.info("Socket.IO server closed");

      await pool.end();
      logger.info("Database pool closed");

      process.exit(serverError ? 1 : 0);
    } catch (error) {
      logger.error(
        { err: error },
        "Error during graceful shutdown"
      );

      process.exit(1);
    }
  });
}

process.on("SIGTERM", () => {
  void gracefulShutdown("SIGTERM");
});

process.on("SIGINT", () => {
  void gracefulShutdown("SIGINT");
});
