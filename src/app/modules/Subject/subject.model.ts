import { model, Schema } from "mongoose";
import { ISubject } from "./subject.interface";

// Define the schema
const subjectSchema = new Schema<ISubject>(
  {
    grade: {
      type: Schema.Types.ObjectId,
      ref: "Grade",
      default: null,
    },
    name: {
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

export const SubjectModel = model<ISubject>("Subject", subjectSchema);
