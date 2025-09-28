import { model, Schema } from "mongoose";
import IEvent from "./event.interface";

const eventSchema: Schema<IEvent> = new Schema(
  {
    // user: {
    //   type: Schema.Types.ObjectId,
    //   ref: "User",
    // },
    name: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    eventDate: { type: Date, required: true },
    description: { type: String },
    status: { type: String, enum: ["Upcoming", "Completed", "Canceled"] },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const EventModel = model<IEvent>("Event", eventSchema);
