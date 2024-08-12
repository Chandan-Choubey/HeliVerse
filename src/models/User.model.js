import mongoose, { Schema } from "mongoose";

const UserSchema = Schema({
  username: {
    type: String,
    required: true,
    lowercase: true,
    minlength: 4,
    maxlength: 20,
  },
  email: {
    type: String,
    unique: true,
    required: true,
    lowercase: true,
    trim: true,
  },
  role: {
    type: String,
    enum: ["Principle", "Teacher", "Student"],
    required: true,
  },
  classroom: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom" },
});

export const User = mongoose.models.User || mongoose.model("User", UserSchema);
