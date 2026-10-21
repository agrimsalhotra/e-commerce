import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import logger from "../config/logger.js";

let io;

function tenantRoom(tenantId) {
  return `tenant:${tenantId}`;
}

export function initializeSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ["GET", "POST"],
    },
  });

  // Authenticate each connection using a JWT.
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

      // Adapt these claim names to match your existing JWT payload.
      if (decoded.userId == null || decoded.tenantId == null) {
        return next(new Error("Invalid token claims"));
      }

      socket.data.userId = decoded.userId;
      socket.data.tenantId = decoded.tenantId;
      socket.data.role = decoded.role;
      
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });


  io.on("connection", (socket) => {
    const { userId, tenantId, role } = socket.data;

    // The room comes from the verified token, not client input.
    const room = tenantRoom(tenantId);
    socket.join(room);

    logger.info(
      { socketId: socket.id, userId, tenantId ,role},
      "WebSocket client connected"
    );

    socket.on("disconnect", (reason) => {
      logger.info(
        { socketId: socket.id, userId, tenantId,role, reason },
        "WebSocket client disconnected"
      );
    });
  });

  logger.info("Socket.IO server initialized");

  return io;
}

export function emitToTenant(tenantId, eventName, payload) {
  if (!io) {
    logger.warn(
      { tenantId, eventName },
      "Socket.IO is not initialized; event was not broadcast"
    );
    return;
  }

  io.to(tenantRoom(tenantId)).emit(eventName, payload);

  logger.info(
    { tenantId, eventName },
    "WebSocket event broadcast"
  );
}

export function closeSocketServer() {
  if (!io) {
    return Promise.resolve();
  }

  const currentIo = io;
  io = undefined;

  return new Promise((resolve) => {
    currentIo.close(() => resolve());
  });
}