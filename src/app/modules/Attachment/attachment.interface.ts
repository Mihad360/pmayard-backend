import { Types } from "mongoose";

export interface IAttachment {
  conversation_id?: Types.ObjectId;
  message_id?: Types.ObjectId;
  fileUrl?: string;
  mimeType?: string;
  isDeleted: boolean;
}
