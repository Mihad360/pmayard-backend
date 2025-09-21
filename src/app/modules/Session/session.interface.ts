import { Types } from "mongoose";

export interface ISession {
  parent?: Types.ObjectId; // ObjectId for the parent (assuming it's a reference to another collection)
  professional?: Types.ObjectId; // ObjectId for the professional (another reference)
  day?: string; // Enum of days (e.g., 'Monday', 'Tuesday', etc.)
  date?: Date; // The date of the session
  time?: string; // Time in a string format (e.g., '10:00 AM')
  subject?: string; // Topic of the session
  status?: "Upcoming" | "Completed" | "Canceled"; // Status of the session
  code?: string;
  isVerifiedByUser?: boolean;
  isDeleted?: boolean; // Boolean flag for deletion status
  createdAt?: Date; // Timestamp of creation
  updatedAt?: Date; // Timestamp of the last update
}
