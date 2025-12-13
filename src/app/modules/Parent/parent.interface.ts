import { Types } from "mongoose";

export interface IParent {
  _id?: Types.ObjectId;
  user?: Types.ObjectId;
  name: string;
  phoneNumber: string;
  childs_name: string;
  childs_grade: string;
  relationship_with_child: string;
  profileImage?: string;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
