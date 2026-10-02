import jwt from "jsonwebtoken";

export function authenticate(req, res, next) {
  const authorization =
    req.headers.authorization;

  if (!authorization) {
    return res.status(401).json({
      error: "Authentication required"
    });
  }

  const [scheme, token] =
    authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      error: "Invalid authorization header"
    });
  }

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET
    );

    req.user = {
      userId: payload.userId,
      tenantId: payload.tenantId,
      role: payload.role
    };

    next();

  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Access token expired"
      });
    }

    return res.status(401).json({
      error: "Invalid access token"
    });
  }
}