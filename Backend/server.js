const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

const connectDB = require("./src/config/db");

dotenv.config();
connectDB();

const app = express();

app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  require("./src/routes/payment.routes"),
);

app.use(
  cors({
    origin: [
      "https://swiftmove-movers-and-packers.vercel.app",
      "http://localhost:5173",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());

app.use("/api/payments", require("./src/routes/payment.routes"));
app.use("/api/auth", require("./src/routes/auth.routes"));
app.use("/api/users", require("./src/routes/user.routes"));
app.use("/api/moves", require("./src/routes/move.routes"));
app.use("/api/dashboard", require("./src/routes/dashboard.routes"));

app.get("/", (_, res) => res.send("Backend running"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
