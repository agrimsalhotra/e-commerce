import express from "express";

import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  patchProduct,
  deleteProduct
} from "../controllers/productController.js";

//import { tenantMiddleware } from "../middleware/tenantMiddleware.js";

import { validate } from "../middleware/validate.js";

import {
  createProductSchema,
  replaceProductSchema,
  updateProductSchema
} from "../validators/productValidator.js";
import { authenticate } from "../middleware/authMiddleware.js";

import { asyncHandler } from "../utils/asyncHandler.js";


const router = express.Router();

router.use(authenticate);

router.get("/", asyncHandler(getProducts));



router.get("/:id", asyncHandler(getProductById));

router.post(
  "/",
  validate(createProductSchema),
  asyncHandler(createProduct)
);

router.put(
  "/:id",
  validate(replaceProductSchema),
  asyncHandler(updateProduct)
);

router.patch(
  "/:id",
  validate(updateProductSchema),
  asyncHandler(patchProduct)
);

router.delete("/:id", deleteProduct);

export default router;