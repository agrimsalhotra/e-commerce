import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  mkdir,
  rename,
  unlink
} from "node:fs/promises";

import sharp from "sharp";
import { fileTypeFromFile } from "file-type";

import pool from "../config/db.js";
import { AppError } from "../utils/AppError.js";
import logger from "../config/logger.js";

const TEMP_DIRECTORY = path.resolve(
  "uploads/products/temp"
);

const PROCESSED_DIRECTORY = path.resolve(
  "uploads/products/processed"
);

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp"
]);

async function removeFile(filePath) {
  if (!filePath) return;

  try {
    await unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      logger.error(
        { err: error, filePath },
        "Failed to remove uploaded file"
      );
    }
  }
}

export async function saveProductImage({
  tenantId,
  productId,
  tempFilePath
}) {
  let processedTempPath;
  let finalPath;
  let finalFileCreated = false;
  let succeeded = false;

  try {
    await mkdir(TEMP_DIRECTORY, { recursive: true });
    await mkdir(PROCESSED_DIRECTORY, { recursive: true });

    // 1. Check the actual file signature.
    const fileType = await fileTypeFromFile(tempFilePath);

    if (!fileType || !ALLOWED_TYPES.has(fileType.mime)) {
      throw new AppError(
        "Only JPEG, PNG, and WebP images are allowed",
        415
      );
    }

    // 2. Create a temporary processed image.
    const outputName = `${randomUUID()}.webp`;

    processedTempPath = path.join(
      TEMP_DIRECTORY,
      `${randomUUID()}.processing`
    );

    finalPath = path.join(
      PROCESSED_DIRECTORY,
      outputName
    );

    // Sharp decodes and re-encodes the image.
    // It does not load the entire compressed upload into a
    // JavaScript Buffer, although image decoding consumes memory.
    await sharp(tempFilePath, {
      limitInputPixels: 40_000_000,
      failOn: "error"
    })
      .rotate()
      .resize({
        width: 1200,
        height: 1200,
        fit: "inside",
        withoutEnlargement: true
      })
      .webp({ quality: 80 })
      .toFile(processedTempPath);

    // 3. Ensure the product belongs to the authenticated tenant.
    const [products] = await pool.query(
      `
        SELECT id
        FROM products
        WHERE tenant_id = ?
          AND id = ?
        LIMIT 1
      `,
      [tenantId, productId]
    );

    if (products.length === 0) {
      throw new AppError("Product not found", 404);
    }

    // 4. Move the processed image to its final location.
    await rename(processedTempPath, finalPath);

    processedTempPath = undefined;
    finalFileCreated = true;

    const imageUrl = `/uploads/products/processed/${outputName}`;

    // 5. Save the image URL in MySQL.
    const [result] = await pool.query(
      `
        UPDATE products
        SET image_url = ?
        WHERE tenant_id = ?
          AND id = ?
      `,
      [imageUrl, tenantId, productId]
    );

    if (result.affectedRows !== 1) {
      throw new AppError("Product not found", 404);
    }

    succeeded = true;

    return {
      productId,
      imageUrl
    };
  } catch (error) {
    throw error;
  } finally {
    // Always delete the incoming upload.
    await removeFile(tempFilePath);

    // Delete incomplete processing output.
    if (processedTempPath) {
      await removeFile(processedTempPath);
    }

    // Delete the final image if anything failed after it was created.
    if (finalFileCreated && !succeeded) {
      await removeFile(finalPath);
    }
  }
}