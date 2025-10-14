const { Schema, model } = require("mongoose");
const { ROLES } = require("../constants/roles");

const userSchema = new Schema(
  {
    nombre: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    direccion: { type: String, default: null },
    role: { type: String, enum: ROLES, default: "USUARIO", index: true },
  },
  { timestamps: true }
);

module.exports = model("User", userSchema);
