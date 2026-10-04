import { z } from "zod";

export const checkoutSchema = z.object({
  productId: z.coerce
    .number()
    .int()
    .positive(),

  quantity: z.coerce
    .number()
    .int()
    .positive()
    .max(100)
});