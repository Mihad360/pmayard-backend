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
      required: true,
    },
    last_msg: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
    message_type: { type: String, enum: ["text", "attachments"] },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Message = model<IMessage>("Message", messageSchema);
