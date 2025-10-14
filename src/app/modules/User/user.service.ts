import HttpStatus from "http-status";
import AppError from "../../erros/AppError";
import { IUser } from "./user.interface";
import { UserModel } from "./user.model";
import { JwtPayload } from "../../interface/global";
import { createToken } from "../../utils/jwt";
import config from "../../config";
import { Types } from "mongoose";
import { INotification } from "../Notification/notification.interface";
import { createAdminNotification } from "../Notification/notification.service";

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
      await createAdminNotification(notInfo);
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

export const userServices = {
  registerUser,
  getMe,
};
