import * as authService from "../services/authService.js";

export async function register(req, res, next) {
  
    const user = await authService.registerUser({
      tenantId: req.body.tenantId,
      email: req.body.email,
      password: req.body.password
    });

    res.status(201).json(user);

  
}

export async function login(req, res, next) {
  
    const result = await authService.loginUser({
      tenantId: req.body.tenantId,
      email: req.body.email,
      password: req.body.password
    });

    if (!result) {
      return res.status(401).json({
        error: "Invalid credentials"
      });
    }

    res.cookie(
      "refreshToken",
      result.refreshToken,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
      }
    );

    res.json({
      accessToken: result.accessToken,
      user: result.user
    });

  
}