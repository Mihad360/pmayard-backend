import { Types } from "mongoose";
import { IMessage } from "../Message/message.interface";
import { IUser } from "../User/user.interface";

// Enum to define the type of conversation
export enum ConversationType {
  INDIVIDUAL = "individual",
  GROUP = "group",
}

// Define the IConversation interface
export interface IConversation {
  _id?: Types.ObjectId;
  conversationName?: string;
  type: ConversationType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  users: Types.ObjectId[] | any; // Allow single user or array
  lastMsg?: IMessage | Types.ObjectId;
  isDeleted: boolean;
}

export interface IConversationExtendsWithLastMsg extends IConversation {
  lastMsg: IMessage;
}
export interface IConversationWithUsers extends Omit<IConversation, "users"> {
  users: IUser[]; // Replace ObjectId array with fully populated IUser array
}
