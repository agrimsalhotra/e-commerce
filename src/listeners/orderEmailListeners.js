import logger from "../config/logger.js";

export async function handleOrderEmail(order) {
  logger.info(
    {
      orderId: order.orderId,
      tenantId: order.tenantId,
      userId: order.userId
    },
    "Order confirmation email queued for processing"
  );

  // Simulate asynchronous I/O.
  await new Promise((resolve) => {
    setTimeout(resolve, 1000);
  });

  logger.info(
    {
      orderId: order.orderId
    },
    "Order confirmation email processed"
  );
}