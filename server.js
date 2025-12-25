const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./src/config/db");

dotenv.config();

connectDB();

const app = express();

app.use(express.json());

// Routes
app.use("/api/auth", require("./src/routes/auth.routes"));
app.use("/api/users", require("./src/routes/user.routes"));
app.use("/api/admin", require("./src/routes/admin.routes"));
app.use("/api/service-requests", require("./src/routes/serviceRequest.routes"));

// Root test
app.get("/", (req, res) => {
  res.send("Backend running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
