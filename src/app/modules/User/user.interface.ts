import { Model, Types } from "mongoose";
import { IProfessional } from "../Professional/professional.interface";
import { IParent } from "../Parent/parent.interface";

// export interface IRole {
//   _id: Types.ObjectId;
//   name: string;
//   profileImage: string;
// }

export interface IUser {
  _id?: Types.ObjectId;
  roleId?: IProfessional | IParent | Types.ObjectId; // roleId can either be populated (IRole) or an ObjectId reference
  email: string;
  password: string;
  name?: string;
  profileImage?: string;
  role?: "professional" | "parent" | "admin";
  roleRef?: "Professional" | "Parent" | "Admin";
  isActive?: boolean;
  otp?: string;
  expiresAt?: Date;
  isVerified?: boolean;
  isDeleted?: boolean;
  passwordChangedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IEditUserProfilePayload {
  email?: string; // Optional email to be updated (only for admin)
  profileImage?: string; // Profile image URL
  phoneNumber?: string; // Optional phone number
  name?: string; // Optional name
  subjects?: string[];
  bio?: string;
}

export interface IUserWithPopulatedRole extends IUser {
  roleId: IProfessional | IParent; // roleId is populated, so it includes profileImage and name
}

export interface UserInterface extends Model<IUser> {
  isUserExistByEmail(email: string): Promise<IUser>;
  compareUserPassword(
    payloadPassword: string,
    hashedPassword: string,
  ): Promise<boolean>;
  newHashedPassword(newPassword: string): Promise<string>;
  isOldTokenValid: (
    passwordChangedTime: Date,
    jwtIssuedTime: number,
  ) => Promise<boolean>;
  isJwtIssuedBeforePasswordChange(
    passwordChangeTimeStamp: Date,
    jwtIssuedTimeStamp: number,
  ): boolean;
  isUserExistByCustomId(email: string): Promise<IUser>;
}
