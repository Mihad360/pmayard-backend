import { model, Schema } from "mongoose";

const groupSchema = new Schema({
  group_name: {
    type: String,
    required: true,
    trim: true,
  },
  is_announcement_group: {
    type: Boolean,
    default: false,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

export const GroupModel = model("Group", groupSchema);

