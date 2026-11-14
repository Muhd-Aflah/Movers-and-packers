const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "admin", "mover"],
      default: "user",
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    // Optional for customer/admin accounts. New mover signups explicitly start
    // pending; legacy movers stay fail-closed until the controlled migration.
    moverApprovalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
    },
    moverReviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    moverReviewedAt: {
      type: Date,
    },
    moverReviewReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    phone: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Supports chronological admin user lists and role-scoped mover lists.
userSchema.index({ createdAt: -1, _id: -1 });
userSchema.index({ role: 1, createdAt: -1, _id: -1 });
userSchema.index({ role: 1, moverApprovalStatus: 1, createdAt: -1, _id: -1 });

module.exports = mongoose.model("User", userSchema);
