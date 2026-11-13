module.exports = (err, req, res, next) => {
  console.error(err.stack);

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: statusCode >= 500 ? "Server Error" : err.message || "Request failed",
  });
};
