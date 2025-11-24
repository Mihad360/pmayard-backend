import { model, Schema } from "mongoose";
import { ISession } from "./session.interface";

const sessionSchema = new Schema<ISession>(
  {
    parent: { type: Schema.Types.ObjectId, ref: "Parent" },
    professional: {
      type: Schema.Types.ObjectId,
      ref: "Professional",
    },
    conversation_id: { type: Schema.Types.ObjectId, ref: "Conversation" },
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
      default: null,
    },
    date: { type: Date, default: null },
    time: { startTime: { type: String }, endTime: { type: String } },
    subject: { type: String },
    status: {
      type: String,
      enum: ["Upcoming", "Confirmed", "Completed", "Canceled"],
      default: "Upcoming",
    },
    code: { type: String, default: null },
    isSessionVerified: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const SessionModel = model<ISession>("Session", sessionSchema);
