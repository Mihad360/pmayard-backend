import { model, Schema } from "mongoose";
import { IGrade } from "./grade.interface";

// Define the schema
const gradeSchema = new Schema<IGrade>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    name: {
      type: String,
      required: true,
      unique: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export const GradeModel = model<IGrade>("Grade", gradeSchema);
