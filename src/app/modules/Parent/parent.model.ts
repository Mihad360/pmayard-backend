import { model, Schema } from "mongoose";
import { IParent } from "./parent.interface";

// Create a schema for Parent
const ParentSchema: Schema = new Schema<IParent>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    name: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    childs_name: { type: String, required: true },
    childs_grade: { type: String, required: true },
    relationship_with_child: { type: String, required: true },
    profileImage: { type: String },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const ParentModel = model<IParent>("Parent", ParentSchema);
