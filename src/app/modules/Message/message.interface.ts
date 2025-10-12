import { Types } from "mongoose";

export interface IMessage extends Document {
  conversation_id: Types.ObjectId;
  sender_id: Types.ObjectId;
  attachment_id?: Types.ObjectId[] | string[];
  message_text: string;
  last_msg: Types.ObjectId;
  message_type: "text" | "attachments";
  isDeleted: boolean;
}
