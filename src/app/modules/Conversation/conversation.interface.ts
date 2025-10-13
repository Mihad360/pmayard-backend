import { Types } from "mongoose";
import { IMessage } from "../Message/message.interface";

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
  lastMsg?: IMessage | Types.ObjectId; // Store the ID of the last message in the conversation
  isDeleted: boolean;
}

export interface IConversationExtendsWithLastMsg extends IConversation {
  lastMsg: IMessage;
}
