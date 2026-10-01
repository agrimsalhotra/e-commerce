import { z } from "zod";

export const createProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Product name is required")
    .max(255, "Product name is too long"),

  price: z
    .number()
    .nonnegative("Price cannot be negative")
});

export const updateProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(255)
    .optional(),

  price: z
    .number()
    .nonnegative()
    .optional()
});

export const replaceProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(255),

  price: z
    .number()
    .finite()
    .nonnegative()
});