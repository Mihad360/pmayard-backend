import { Types } from "mongoose";

export interface IGrade extends Document {
  user?: Types.ObjectId;
  name: string; // Name of the grade
  isDeleted?: boolean; // Soft delete flag
  createdAt?: Date; // Date the grade was created
  updatedAt?: Date; // Date the grade was last updated
}
