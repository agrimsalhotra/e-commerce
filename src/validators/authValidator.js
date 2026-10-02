import { z } from "zod";

export const registerSchema = z.object({
  tenantId: z.coerce
    .number()
    .int()
    .positive(),

  email: z
    .string()
    .trim()
    .email()
    .max(255),

  password: z
    .string()
    .min(8)
    .max(128)
});

export const loginSchema = z.object({
  tenantId: z.coerce
    .number()
    .int()
    .positive(),

  email: z
    .string()
    .trim()
    .email(),

  password: z
    .string()
    .min(1)
});