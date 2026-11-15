
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");
const { createServer } = require("http");

const connectDB = require("./src/config/db");
const { createCorsOptions, resolveCorsConfig } = require("./src/config/cors");
const { startPaymentRecoveryWorker } = require("./src/controllers/payment.controller");
const { initializeSocketServer } = require("./src/realtime/socket");
const Notification = require("./src/models/notification.model");

dotenv.config();

const app = express();

const corsEnvironment = resolveCorsConfig(process.env);
app.use(cors(createCorsOptions(corsEnvironment)));
const httpServer = createServer(app);
initializeSocketServer(httpServer, corsEnvironment);

app.use(express.json({
  verify(req, res, buffer) {
    if (req.path === "/api/payments/webhook") req.rawBody = Buffer.from(buffer);
  },
}));

// API routes
app.use("/api/payments", require("./src/routes/payment.routes"));
app.use("/api/auth", require("./src/routes/auth.routes"));
app.use("/api/users", require("./src/routes/user.routes"));
app.use("/api/moves", require("./src/routes/move.routes"));
app.use("/api/pricing", require("./src/routes/pricing.routes"));
app.use("/api/dashboard", require("./src/routes/dashboard.routes"));
app.use("/api/admin", require("./src/routes/admin.routes"));
app.use("/api/provider", require("./src/routes/provider.routes"));
app.use("/api/notifications", require("./src/routes/notification.routes"));

// Staging health check
app.get("/api/health", (req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;

  res.status(databaseConnected ? 200 : 503).json({
    status: databaseConnected ? "ok" : "error",
    database: databaseConnected ? "connected" : "disconnected",
    environment: process.env.NODE_ENV || "development",
  });
});

// Root route
app.get("/", (_, res) => {
  res.send("Backend running");
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handler
app.use(require("./src/middleware/error.middleware"));

const PORT = process.env.PORT || 5000;

const validateStartupConfig = () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required");
  }

  if (
    !process.env.JWT_SECRET ||
    Buffer.byteLength(process.env.JWT_SECRET) < 32
  ) {
    throw new Error(
      "JWT_SECRET must contain at least 32 bytes of random secret material",
    );
  }

  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    throw new Error("RAZORPAY_WEBHOOK_SECRET is required");
  }

  const trustProxyHops = Number(process.env.TRUST_PROXY_HOPS || 0);

  if (!Number.isSafeInteger(trustProxyHops) || trustProxyHops < 0) {
    throw new Error("TRUST_PROXY_HOPS must be a non-negative integer");
  }

  app.set("trust proxy", trustProxyHops);

  resolveCorsConfig(process.env);
};

const startServer = async () => {
  validateStartupConfig();

  await connectDB();
  await Notification.init();
  startPaymentRecoveryWorker();

  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error("Server startup failed:", error.message);
  process.exit(1);
});
