import express from "express";

import { authenticate } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";

import { checkout } from "../controllers/orderController.js";

import {
  checkoutSchema
} from "../validators/orderValidator.js";

const router = express.Router();

router.use(authenticate);

router.post(
  "/checkout",
  validate(checkoutSchema),
  checkout
);

export default router;