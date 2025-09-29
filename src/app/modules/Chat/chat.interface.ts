import { Document, Types } from "mongoose";

export interface IChat extends Document {
  chatType: "individual" | "group" | "announcement";
  users?: Types.ObjectId[];
  group_id?: boolean;
  isDeleted?: boolean; // Flag to indicate if the chat is deleted
  createdAt?: Date; // Date when the chat was created
  updatedAt?: Date; // Date when the chat was last updated
}
