import { Types } from "mongoose";

// Enum to define the type of conversation
export enum ConversationType {
  INDIVIDUAL = "individual",
  GROUP = "group",
}

// Define the IConversation interface
export interface IConversation {
  _id?: Types.ObjectId;
  conversationName?: string;
  type: ConversationType; // "individual" or "group"
  users: Types.ObjectId[]; // List of users involved in the conversation (for group conversations)
  lastMsg?: Types.ObjectId; // Store the ID of the last message in the conversation
  isDeleted: boolean;
}
