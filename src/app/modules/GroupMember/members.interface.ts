import { Types } from "mongoose";

export interface IGroupMembership extends Document {
  user_id: Types.ObjectId;
  group_id: Types.ObjectId;
  role: "Admin" | "Member";
}
