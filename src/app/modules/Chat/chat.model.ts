import { Schema, model } from "mongoose";
import { IChat } from "./chat.interface";

const chatSchema = new Schema<IChat>(
  {
    chatType: {
      type: String,
      enum: ["individual", "group", "announcement"],
      required: true,
    },
    users: {
      type: [Schema.Types.ObjectId],
      ref: "User",
    },
    group_id: {
      type: Schema.Types.ObjectId,
      ref: "Group",
    },
    isDeleted: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export const ChatModel = model<IChat>("Chat", chatSchema);
