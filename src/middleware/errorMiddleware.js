import logger from "../config/logger.js";

export function errorMiddleware(err, req, res, next) {
  logger.error({
    err,
    method: req.method,
    url: req.originalUrl
  }, "Request failed");

  const statusCode = err.statusCode || 500;

  if (statusCode >= 500) {
    return res.status(500).json({
      error: "Internal server error"
    });
  }

  return res.status(statusCode).json({
    error: err.message
  });
}
// export function errorMiddleware(err, req, res, next) {
//   console.error(err);

//   const statusCode =
//     err.statusCode || 500;

//   res.status(statusCode).json({
//     error:
//       statusCode === 500
//         ? "Internal server error"
//         : err.message
//   });
// }