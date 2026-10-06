import express from "express";

import { authenticate } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";

import { checkout } from "../controllers/orderController.js";

import {
  checkoutSchema
} from "../validators/orderValidator.js";

import { asyncHandler } from "../utils/asyncHandler.js";


const router = express.Router();

router.use(authenticate);

router.post(
  "/checkout",
  validate(checkoutSchema),
  asyncHandler(checkout)
);

export default router;