import { model, Schema } from "mongoose";
import { IAttachment } from "./attachment.interface";

const attachmentSchema = new Schema<IAttachment>(
  {
    conversation_id: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
    },
    message_id: { type: Schema.Types.ObjectId, ref: "Message" },
    fileUrl: { type: String },
    fileName: { type: String },
    mimeType: { type: String },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const AttachmentModel = model<IAttachment>(
  "Attachment",
  attachmentSchema,
);
