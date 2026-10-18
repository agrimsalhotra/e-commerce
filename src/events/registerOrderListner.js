import orderEvents from "./orderEvents.js";

import {
  handleOrderEmail
} from "../listeners/orderEmailListener.js";

import {
  handleAdminNotification
} from "../listeners/orderAdminListener.js";

import {
  handleOrderAnalytics
} from "../listeners/orderAnalyticsListener.js";

import logger from "../config/logger.js";

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
}

export function registerOrderListeners() {
  orderEvents.on("order:placed", onOrderPlaced);

  logger.info("Order event listeners registered");
}