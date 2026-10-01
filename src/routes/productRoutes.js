import express from "express";

import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  patchProduct,
  deleteProduct
} from "../controllers/productController.js";

import { tenantMiddleware } from "../middleware/tenantMiddleware.js";

import { validate } from "../middleware/validate.js";

import {
  createProductSchema,
  replaceProductSchema,
  updateProductSchema
} from "../validators/productValidator.js";

const router = express.Router();

router.use(tenantMiddleware);

router.get("/", getProducts);

router.get("/:id", getProductById);

router.post(
  "/",
  validate(createProductSchema),
  createProduct
);

router.put(
  "/:id",
  validate(replaceProductSchema),
  updateProduct
);

router.patch(
  "/:id",
  validate(updateProductSchema),
  patchProduct
);

router.delete("/:id", deleteProduct);

export default router;