import { model, Schema } from "mongoose";
import { IMaterial } from "./material.interface";

const materialSchema = new Schema<IMaterial>(
  {
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export const MaterialModel = model<IMaterial>("Material", materialSchema);
