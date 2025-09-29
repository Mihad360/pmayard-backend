import { model, Schema } from "mongoose";

const messageSchema = new Schema(
  {
    chat_id: {
      // Could reference a group or individual chat
      type: Schema.Types.ObjectId,
      ref: "Chat",
    },
    sender_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    message_text: {
      type: String,
      required: true,
    },
    is_announcement: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export const Message = model("Message", messageSchema);
