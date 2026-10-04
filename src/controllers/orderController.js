import * as orderService from "../services/orderService.js";

export async function checkout(req, res, next) {
  try {
    const order = await orderService.checkoutService({
      tenantId: req.user.tenantId,
      userId: req.user.userId,
      productId: req.body.productId,
      quantity: req.body.quantity
    });

    res.status(201).json(order);

  } catch (error) {
    next(error);
  }
}