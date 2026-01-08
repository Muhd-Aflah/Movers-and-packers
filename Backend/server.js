const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./src/config/db");
const errorHandler = require("./src/middleware/error.middleware");

dotenv.config();
connectDB();

const app = express();
const paymentRoutes = require("./src/routes/payment.routes");

// Razorpay webhook 
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  paymentRoutes
);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", require("./src/routes/auth.routes"));
app.use("/api/users", require("./src/routes/user.routes"));
app.use("/api/admin", require("./src/routes/admin.routes"));
app.use("/api/service-requests", require("./src/routes/serviceRequest.routes"));
app.use("/api/payments", paymentRoutes);

// Root test
app.get("/", (req, res) => {
  res.send("Backend running");
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
