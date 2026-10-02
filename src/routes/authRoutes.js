import express from "express";

import {
  register,
  login,
  //refresh
} from "../controllers/authController.js";

import { validate } from "../middleware/validate.js";

import {
  registerSchema,
  loginSchema
} from "../validators/authValidator.js";

const router = express.Router();

// router.post("/register", register);
// router.post("/login", login);
router.post(
  "/register",
  validate(registerSchema),
  register
);

router.post(
  "/login",
  validate(loginSchema),
  login
);
//router.post("/refresh", refresh);

export default router;