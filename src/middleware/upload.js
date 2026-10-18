import multer from "multer";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { AppError } from "../utils/AppError.js";

const TEMP_DIRECTORY = path.resolve(
  "uploads/products/temp"
);

// Ensure the temporary directory exists before accepting uploads.
await mkdir(TEMP_DIRECTORY, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, TEMP_DIRECTORY);
  },

  filename: (req, file, callback) => {
    // Do not trust or reuse the client's filename.
    callback(null, `${randomUUID()}.upload`);
  }
});

const multerUpload = multer({
  storage,

  // Restrict upload size.
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
    fields: 5,
    parts: 6,
    fieldNameSize: 100
  }
});

export const uploadProductImage = (req, res, next) => {
  multerUpload.single("image")(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return next(
          new AppError("Image must not exceed 5 MB", 413)
        );
      }

      if (error.code === "LIMIT_UNEXPECTED_FILE") {
        return next(
          new AppError(
            "Unexpected file field. Use the field 'image'.",
            400
          )
        );
      }

      return next(
        new AppError("Invalid file upload", 400)
      );
    }

    next(error);
  });
};