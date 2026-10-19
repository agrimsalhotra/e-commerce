import logger from "../config/logger.js";

export async function handleOrderAnalytics(order) {
  logger.info(
    {
      event: "order_placed",
      orderId: order.orderId,
      tenantId: order.tenantId,
      totalAmount: order.totalAmount
    },
    "Order analytics event recorded"
  );

  // In a real system, send this event to your analytics
  // platform or persist it in an analytics table.
}