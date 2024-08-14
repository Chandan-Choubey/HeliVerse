import mongoose, { Schema } from "mongoose";

const timetableSchema = Schema({
  classroom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Classroom",
    required: true,
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  schedule: [
    {
      day: {
        type: String,
        enum: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        required: true,
      },
      startTime: { type: String, required: true },
      endTime: { type: String, required: true },
      subject: { type: String, required: true },
    },
  ],
});

export const Timetable =
  mongoose.models.Timetable || mongoose.model("Timetable", timetableSchema);
