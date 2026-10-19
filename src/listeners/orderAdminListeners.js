import logger from "../config/logger.js";

export async function handleAdminNotification(order) {
  logger.info(
    {
      orderId: order.orderId,
      tenantId: order.tenantId,
      totalAmount: order.totalAmount
    },
    "Admin notification started"
  );

  await new Promise((resolve) => {
    setTimeout(resolve, 500);
  });

  logger.info(
    {
      orderId: order.orderId,
      tenantId: order.tenantId
    },
    "Admin notification completed"
  );
}