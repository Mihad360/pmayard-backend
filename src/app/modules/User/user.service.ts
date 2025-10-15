import HttpStatus from "http-status";
import AppError from "../../erros/AppError";
import { IEditUserProfilePayload, IUser } from "./user.interface";
import { UserModel } from "./user.model";
import { JwtPayload } from "../../interface/global";
import { createToken } from "../../utils/jwt";
import config from "../../config";
import { Types } from "mongoose";
import { INotification } from "../Notification/notification.interface";
import { createNotification } from "../Notification/notification.service";
import { ProfessionalModel } from "../Professional/professional.model";
import { sendFileToCloudinary } from "../../utils/sendImageToCloudinary";
import { ParentModel } from "../Parent/parent.model";
import { IProfessional } from "../Professional/professional.interface";
import { IParent } from "../Parent/parent.interface";

const registerUser = async (payload: IUser) => {
  const isUserExist = await UserModel.findOne({ email: payload.email });
  if (isUserExist) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "The same user is already exist",
    );
  }
  const result = await UserModel.create(payload);
  if (result) {
    const jwtPayload: JwtPayload = {
      user: result._id,
      email: result?.email,
      role: result?.role,
    };

    const accessToken = createToken(
      jwtPayload,
      config.jwt_access_secret as string,
      config.jwt_access_expires_in as string,
    );

    const refreshToken = createToken(
      jwtPayload,
      config.jwt_refresh_secret as string,
      config.jwt_refresh_expires_in as string,
    );

    if (accessToken && refreshToken && !result.isVerified) {
      await UserModel.findByIdAndUpdate(result._id, {
        isVerified: true,
      });
    }

    if (accessToken && refreshToken && !result.isVerified) {
      const notInfo: INotification = {
        sender: new Types.ObjectId(result._id),
        type: "user_registration",
        message: `User Registered: (${result.email})`,
      };
      await createNotification(notInfo);
    }

    return {
      role: result.role,
      accessToken,
      refreshToken,
    };
  }
};

const getMe = async (user: JwtPayload) => {
  const userId = new Types.ObjectId(user.user);
  const isUserExist = await UserModel.findById(userId).select("-password");

  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "The user does not exist");
  }

  if (isUserExist.isDeleted) {
    throw new AppError(HttpStatus.NOT_FOUND, "The user is blocked");
  }

  // Skip population if role is 'admin'
  if (isUserExist.role !== "admin") {
    await isUserExist.populate("roleId");
  }

  return isUserExist;
};

const editUserProfile = async (
  id: string,
  file: Express.Multer.File,
  payload: Partial<IEditUserProfilePayload>, // Using the payload type defined above
) => {
  // Find the user by ID
  const user = await UserModel.findById(id);
  if (!user) {
    throw new AppError(HttpStatus.NOT_FOUND, "The user does not exist");
  }
  if (user.isDeleted) {
    throw new AppError(HttpStatus.FORBIDDEN, "The user is blocked");
  }
  let userUpdateData: IProfessional | IParent | null = null;
  const updateData: Partial<IEditUserProfilePayload> = {};

  // Handle email update if provided
  if (payload.email) {
    updateData.email = payload.email;
  }
  if (file) {
    const imageName = `${payload.name || "default"}`; // Ensure image name is provided
    const imageInfo = await sendFileToCloudinary(
      file.buffer,
      imageName,
      file.mimetype,
    );
    updateData.profileImage = imageInfo.secure_url;
  }

  // Handle role-specific logic
  if (user.role === "admin") {
    // Admin: Only allow email to be updated
    if (payload.email) {
      updateData.email = payload.email;
    }
  } else if (user.role === "professional") {
    // Professional: Find roleId in the Professional model and update other fields
    const professional = await ProfessionalModel.findById(user.roleId);
    if (!professional) {
      throw new AppError(HttpStatus.NOT_FOUND, "Professional role not found");
    }

    // Update the fields for the professional
    if (payload.name) updateData.name = payload.name;
    if (payload.phoneNumber) updateData.phoneNumber = payload.phoneNumber;
    // Any additional professional-specific fields can go here

    // Update the professional model data
    userUpdateData = await ProfessionalModel.findByIdAndUpdate(
      professional._id,
      {
        $set: updateData,
      },
      { new: true },
    ).select("-availability");
  } else if (user.role === "parent") {
    // Parent: Find roleId in the Parent model and update other fields
    const parent = await ParentModel.findById(user.roleId);
    if (!parent) {
      throw new AppError(HttpStatus.NOT_FOUND, "Parent role not found");
    }

    // Update the fields for the parent
    if (payload.name) updateData.name = payload.name;
    if (payload.phoneNumber) updateData.phoneNumber = payload.phoneNumber;
    // Any additional parent-specific fields can go here

    // Update the parent model data
    userUpdateData = await ParentModel.findByIdAndUpdate(
      parent._id,
      {
        $set: updateData,
      },
      { new: true },
    ).select("-availability");
  }

  if (updateData.email) {
    // Update the user document with the specified data (email only)
    await UserModel.findByIdAndUpdate(
      id,
      { $set: { email: updateData.email } }, // Only updating email in UserModel
      { new: true },
    ).select("-password -otp -expiresAt -isVerified -passwordChangedAt");

    return userUpdateData;
  }
  return userUpdateData;
};

const deleteUser = async (id: string) => {
  const user = await UserModel.findById(id);
  if (!user) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }
  if (user.isDeleted) {
    throw new AppError(HttpStatus.BAD_REQUEST, "User already deleted");
  }

  const result = await UserModel.findByIdAndUpdate(
    user._id,
    {
      isDeleted: true,
    },
    { new: true },
  ).select("-password -otp -expiresAt -isVerified -passwordChangedAt");
  return result;
};

export const userServices = {
  registerUser,
  getMe,
  editUserProfile,
  deleteUser,
};
