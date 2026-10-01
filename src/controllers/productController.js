import * as productService from "../services/productService.js";

export async function createProduct(req, res, next) {
  try {
    const product = await productService.createProduct(
      req.tenantId,
      req.body
    );

    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
}

export async function getProducts(req, res, next) {
  try {
    const limit = Math.min(
      Number(req.query.limit) || 20,
      100
    );

    const page = Math.max(
      Number(req.query.page) || 1,
      1
    );

    const offset = (page - 1) * limit;

    const products = await productService.getProducts(
      req.tenantId,
      limit,
      offset
    );

    res.json({
      data: products,
      pagination: {
        page,
        limit
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getProductById(req, res, next) {
  try {
    const product = await productService.getProductById(
      req.tenantId,
      Number(req.params.id)
    );

    if (!product) {
      return res.status(404).json({
        error: "Product not found"
      });
    }

    res.json(product);
  } catch (error) {
    next(error);
  }
}

export async function updateProduct(req, res, next) {
  try {
    const product = await productService.updateProduct(
      req.tenantId,
      Number(req.params.id),
      req.body
    );

    if (!product) {
      return res.status(404).json({
        error: "Product not found"
      });
    }

    res.json(product);
  } catch (error) {
    next(error);
  }
}

export async function patchProduct(req, res, next) {
  try {
    const product = await productService.patchProduct(
      req.tenantId,
      Number(req.params.id),
      req.body
    );

    if (!product) {
      return res.status(404).json({
        error: "Product not found"
      });
    }

    res.json(product);
  } catch (error) {
    next(error);
  }
}

export async function deleteProduct(req, res, next) {
  try {
    const deleted = await productService.deleteProduct(
      req.tenantId,
      Number(req.params.id)
    );

    if (!deleted) {
      return res.status(404).json({
        error: "Product not found"
      });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}