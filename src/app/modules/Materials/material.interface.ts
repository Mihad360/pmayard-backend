import { Types } from "mongoose";

export interface IMaterial extends Document {
  subjectId?: Types.ObjectId; // Reference to the subject
  title: string; // Title of the material
  // files: {
  fileUrl: string; // URL of the file
  mimeType: string; // MIME type of the file
  // }[]; // MIME type of the file(s)
  isDeleted?: boolean; // Flag to indicate if the material is deleted
  createdAt?: Date; // Date when the material was created
  updatedAt?: Date; // Date when the material was last updated
}
