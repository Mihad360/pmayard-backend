import { model, Schema } from "mongoose";
import { IMessage } from "./message.interface";

const messageSchema = new Schema<IMessage>(
  {
    conversation_id: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
    },
    sender_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    attachment_id: {
      type: [Schema.Types.ObjectId],
      ref: "Attachment",
    },
    message_text: {
      type: String,
    },
    last_msg: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
    is_read: { type: Boolean, default: false },
    message_type: { type: String, enum: ["text", "attachments", "audio"] },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Message = model<IMessage>("Message", messageSchema);
