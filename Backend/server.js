const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const connectDB = require("./src/config/db");
const errorHandler = require("./src/middleware/error.middleware");

const app = express();

app.use(
  cors({
    origin: [
      "https://swiftmove-movers-and-packers.vercel.app",
      "http://localhost:5173",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());

connectDB();

app.use("/api/auth", require("./src/routes/auth.routes"));
app.use("/api/users", require("./src/routes/user.routes"));
app.use("/api/quotes", require("./src/routes/quote.routes"));
app.use("/api/moves", require("./src/routes/move.routes"));
app.use("/api/admin", require("./src/routes/admin.routes"));
app.use("/api/service-requests", require("./src/routes/serviceRequest.routes"));
app.use("/api/dashboard", require("./src/routes/dashboard.routes"));
app.use("/api/payments", require("./src/routes/payment.routes"));

app.get("/", (req, res) => {
  res.send("Backend running");
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
