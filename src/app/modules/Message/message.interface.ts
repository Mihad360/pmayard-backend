import { Types } from "mongoose";

export interface IMessage extends Document {
  chat_id: Types.ObjectId;
  sender_id: Types.ObjectId;
  message_text: string;
  timestamp: Date;
  message_type: "text" | "image" | "video" | "file";
  is_announcement: boolean;
}
