import { model, Schema } from "mongoose";
import { IProfessional } from "./professional.interface";

const TimeSlotSchema = new Schema(
  {
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    status: {
      type: String,
      enum: ["available", "booked", "disabled"],
      required: true,
    },
  },
  // { _id: false },
);

const AvailabilitySchema = new Schema(
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
    },
    timeSlots: { type: [TimeSlotSchema], required: true },
  },
  // { _id: false },
);

const ProfessionalSchema = new Schema<IProfessional>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    name: { type: String, required: true },
    bio: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    profileImage: { type: String, required: true },
    qualification: { type: String, required: true },
    subjects: { type: [String], required: true },
    availability: { type: [AvailabilitySchema], required: true },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

export const ProfessionalModel = model<IProfessional>(
  "Professional",
  ProfessionalSchema,
);
