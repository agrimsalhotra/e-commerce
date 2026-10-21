import orderEvents from "./orderEvents.js";

import {
  handleOrderEmail
} from "../listeners/orderEmailListeners.js";

import {
  handleAdminNotification
} from "../listeners/orderAdminListeners.js";

import {
  handleOrderAnalytics
} from "../listeners/orderAnalyticsListeners.js";

import logger from "../config/logger.js";

import { emitToTenant } from "../realtime/socket.js";

function handleOrderWebSocketUpdate(order) {
  const payload = {
    orderId: order.orderId,
    status: order.status,
    createdAt: new Date().toISOString(),
  };

  emitToTenant(
    order.tenantId,
    "order:placed",
    payload
  );
}

async function runListener(listenerName, handler, order) {
  try {
    await handler(order);
  } catch (error) {
    logger.error(
      {
        err: error,
        listenerName,
        orderId: order.orderId,
        tenantId: order.tenantId
      },
      "Order event listener failed"
    );
  }
}

function onOrderPlaced(order) {
  // Start all listeners without waiting for their completion.
  //
  // runListener catches each listener's rejection, so these
  // promises do not become unhandled rejections.
  void runListener(
    "email",
    handleOrderEmail,
    order
  );

  void runListener(
    "admin",
    handleAdminNotification,
    order
  );

  void runListener(
    "analytics",
    handleOrderAnalytics,
    order
  );
  void runListener(
    "websocket",
    handleOrderWebSocketUpdate,
    order
  );
}

export function registerOrderListeners() {
  orderEvents.on("order:placed", onOrderPlaced);

  logger.info("Order event listeners registered");
}