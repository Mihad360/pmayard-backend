import { model, Schema } from "mongoose";
import { IUser, UserInterface } from "./user.interface";
import bcrypt from "bcrypt";

const userSchema = new Schema<IUser, UserInterface>(
  {
    roleId: {
      type: Schema.Types.ObjectId,
      refPath: "roleRef", // This refers to the 'role' field to determine the collection
      default: null,
    },
    roleRef: {
      type: String,
      enum: ["Professional", "Parent", "User"], // This is the key for the dynamic reference
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, "Please enter a valid email address"],
    },
    password: {
      type: String,
      required: true,
    },
    name: { type: String },
    profileImage: { type: String },
    role: {
      type: String,
      enum: ["professional", "parent", "admin"],
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    passwordChangedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

userSchema.pre("save", async function (next) {
  if (this.password) {
    this.password = await bcrypt.hash(this.password, 12);
    next();
  }
});

userSchema.statics.isUserExistByEmail = async function (email: string) {
  return await UserModel.findOne({ email });
};

userSchema.statics.compareUserPassword = async function (
  payloadPassword: string,
  hashedPassword: string,
): Promise<boolean> {
  const compare = await bcrypt.compare(payloadPassword, hashedPassword);
  return compare;
};

userSchema.statics.newHashedPassword = async function (newPassword: string) {
  const newPass = await bcrypt.hash(newPassword, 12);
  return newPass;
};

userSchema.statics.isOldTokenValid = async function (
  passwordChangedTime: Date,
  jwtIssuedTime: number,
) {
  const passwordLastChangedAt = new Date(passwordChangedTime).getTime() / 1000;
  const jwtIssuedAtInSeconds = jwtIssuedTime;
  if (passwordLastChangedAt > jwtIssuedAtInSeconds) {
    console.log("Token is old.");
  } else {
    console.log("Token is valid.");
  }
  return passwordLastChangedAt > jwtIssuedAtInSeconds;
};

userSchema.statics.isUserExistByCustomId = async function (email: string) {
  return await UserModel.findOne({ email }).select("-password");
};

export const UserModel = model<IUser, UserInterface>("User", userSchema);
