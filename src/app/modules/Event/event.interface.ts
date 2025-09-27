import { Types } from "mongoose";

interface IEvent extends Document {
  user: Types.ObjectId; // Reference to the User model (assumed ObjectId)
  name: string;
  startTime: string; // You can use Date type if it's a Date object, but string is used as per your request
  endTime: string; // Same as startTime
  eventDate: string; // Date in YYYY-MM-DD format or ISO string
  description: string;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export default IEvent;
