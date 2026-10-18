import * as productImageService from "../services/productImageService.js";

export async function uploadProductImage(req, res) {
  if (!req.file) {
    return res.status(400).json({
      error: "An image file is required"
    });
  }

  const result = await productImageService.saveProductImage({
    tenantId: req.user.tenantId,
    productId: Number(req.params.id),
    tempFilePath: req.file.path
  });

  res.status(200).json({
    message: "Product image uploaded successfully",
    product: result
  });
}