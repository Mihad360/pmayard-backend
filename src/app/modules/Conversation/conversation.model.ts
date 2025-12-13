import { Schema, Document, model } from "mongoose";
import { ConversationType, IConversation } from "./conversation.interface";

const ConversationSchema: Schema = new Schema(
  {
    conversationName: {
      type: String,
    },
    type: {
      type: String,
      enum: [ConversationType.INDIVIDUAL, ConversationType.GROUP],
      required: true,
    },
    users: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      required: true,
    },
    lastMsg: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      required: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Create the Mongoose Model
export const ConversationModel = model<IConversation & Document>(
  "Conversation",
  ConversationSchema,
);
