import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
const UserSchema = Schema({
  username: {
    type: String,
    required: true,
    lowercase: true,
    minlength: 4,
    maxlength: 20,
    unique: [true, "username should unique"],
  },
  email: {
    type: String,
    unique: true,
    required: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: [3, "Please enter 8 character password"],
    trim: true,
  },
  role: {
    type: String,
    enum: ["Principle", "Teacher", "Student"],
    required: true,
  },
  classroom: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom" },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

UserSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

UserSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      role: this.role,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

export const User = mongoose.models.User || mongoose.model("User", UserSchema);
