import { model, Schema } from "mongoose";
import IEvent from "./event.interface";

const eventSchema: Schema<IEvent> = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User", // Assuming User is the model you are referencing
      required: true,
    },
    name: { type: String, required: true },
    startTime: { type: String, required: true }, // If you need Date, change type to Date
    endTime: { type: String, required: true },
    eventDate: { type: String, required: true }, // If you need Date, change type to Date
    description: { type: String }, // Array of strings
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }, // automatically adds createdAt and updatedAt fields
);

export const Event = model<IEvent>("Event", eventSchema);
