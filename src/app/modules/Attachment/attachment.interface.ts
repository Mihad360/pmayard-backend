import { Types } from "mongoose";

export interface IAttachment {
  conversation_id?: Types.ObjectId;
  message_id?: Types.ObjectId;
  fileUrl?: string;
  fileName?: string;
  mimeType?: string;
  isDeleted: boolean;
}
