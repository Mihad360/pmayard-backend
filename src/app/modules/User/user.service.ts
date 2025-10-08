import HttpStatus from "http-status";
import AppError from "../../erros/AppError";
import { IUser } from "./user.interface";
import { UserModel } from "./user.model";
import { JwtPayload } from "../../interface/global";
import { createToken } from "../../utils/jwt";
import config from "../../config";
import { Types } from "mongoose";

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

    if (accessToken && !result.isVerified) {
      await UserModel.findByIdAndUpdate(result._id, {
        isVerified: true,
      });
    }

    return {
      role: result.role,
      accessToken,
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
