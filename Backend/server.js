const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

const connectDB = require("./src/config/db");

dotenv.config();

const app = express();

app.use(
  cors({
    origin: [
      "https://swiftmove-movers-and-packers.vercel.app",
      "http://localhost:5173",
      "https://movers-and-packers-fppm.onrender.com", 
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
app.use("/api/pricing", require("./src/routes/pricing.routes"));
app.use("/api/dashboard", require("./src/routes/dashboard.routes"));
app.use("/api/admin", require("./src/routes/admin.routes"));
app.use("/api/provider", require("./src/routes/provider.routes"));

app.get("/", (_, res) => res.send("Backend running"));
app.use((req, res) => res.status(404).json({ message: "Route not found" }));
app.use(require("./src/middleware/error.middleware"));

const PORT = process.env.PORT || 5000;
const validateStartupConfig = () => {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is required");
  if (!process.env.JWT_SECRET || Buffer.byteLength(process.env.JWT_SECRET) < 32) {
    throw new Error("JWT_SECRET must contain at least 32 bytes of random secret material");
  }
  const trustProxyHops = Number(process.env.TRUST_PROXY_HOPS || 0);
  if (!Number.isSafeInteger(trustProxyHops) || trustProxyHops < 0) {
    throw new Error("TRUST_PROXY_HOPS must be a non-negative integer");
  }
  app.set("trust proxy", trustProxyHops);
};

const startServer = async () => {
  validateStartupConfig();
  await connectDB();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

startServer().catch((error) => {
  console.error("Server startup failed:", error.message);
  process.exit(1);
});
