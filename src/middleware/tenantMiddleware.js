export function tenantMiddleware(req, res, next) {
  const tenantId = Number(req.header("X-Tenant-ID"));

  if (!Number.isInteger(tenantId) || tenantId <= 0) {
    return res.status(400).json({
      error: "Valid X-Tenant-ID header is required"
    });
  }

  req.tenantId = tenantId;

  next();
}