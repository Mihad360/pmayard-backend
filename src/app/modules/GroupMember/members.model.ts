import { model, Schema } from "mongoose";

const groupMembershipSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  group_id: {
    type: Schema.Types.ObjectId,
    ref: "Group",
    required: true,
  },
  role: {
    type: String,
    enum: ["Admin", "Member"],
    default: "Member",
  },
});

export const GroupMembership = model("GroupMembership", groupMembershipSchema);
