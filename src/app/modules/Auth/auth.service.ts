import bcrypt from "bcrypt";
import HttpStatus from "http-status";
import AppError from "../../erros/AppError";
import { UserModel } from "../User/user.model";
import { IAuth } from "./auth.interface";
import config from "../../config";
import { createToken } from "../../utils/jwt";
import { JwtPayload } from "../../interface/global";
import { sendEmail } from "../../utils/sendEmail";
import { checkOtp, generateOtp, verificationEmailTemplate } from "./auth.utils";
import { Types } from "mongoose";
import { IUserWithPopulatedRole } from "../User/user.interface";

const loginUser = async (payload: IAuth) => {
  const user = await UserModel.findOne({
    email: payload.email,
  });
  if (!user) {
    throw new AppError(HttpStatus.NOT_FOUND, "The user is not found");
  }
  if (user?.isDeleted) {
    throw new AppError(HttpStatus.BAD_REQUEST, "The user is already Blocked");
  }
  if (!(await UserModel.compareUserPassword(payload.password, user.password))) {
    throw new AppError(HttpStatus.FORBIDDEN, "Password did not matched");
  }

  const userId = user?._id;

  if (!userId) {
    throw new AppError(HttpStatus.NOT_FOUND, "The user id is missing");
  }

  const jwtPayload: JwtPayload = {
    user: userId,
    email: user?.email,
    role: user?.role,
  };

  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    config.jwt_access_expires_in as string,
  );

  if (accessToken && !user.isVerified) {
    await UserModel.findByIdAndUpdate(userId, {
      isVerified: true,
    });
  }

  return {
    _id: user._id,
    role: user.role,
    accessToken,
  };
};

const forgetPassword = async (email: string) => {
  const user = await UserModel.findOne({
    email: email,
  });
  if (!user) {
    throw new AppError(HttpStatus.NOT_FOUND, "This User is not exist");
  }
  if (user?.isDeleted) {
    throw new AppError(HttpStatus.FORBIDDEN, "This User is deleted");
  }

  const userId = user?._id;
  if (!userId) {
    throw new AppError(HttpStatus.NOT_FOUND, "The user id is missing");
  }

  const otp = generateOtp();
  const expireAt = new Date(Date.now() + 5 * 60 * 1000);
  const newUser = await UserModel.findOneAndUpdate(
    { email: user.email },
    {
      otp: otp,
      expiresAt: expireAt,
      isVerified: false,
    },
    { new: true },
  );
  if (newUser) {
    const subject = "Verification Code";
    const otp = newUser.otp;
    const mail = await sendEmail(
      user.email,
      subject,
      verificationEmailTemplate(user.email, otp as string),
    );
    if (!mail.success) {
      throw new AppError(HttpStatus.BAD_REQUEST, "Something went wrong!");
    }
    return mail;
  } else {
    throw new AppError(HttpStatus.BAD_REQUEST, "Something went wrong!");
  }
};

const verifyOtp = async (payload: { email: string; otp: string }) => {
  const user = await UserModel.findOne({
    email: payload.email,
  });

  if (!user) {
    throw new AppError(HttpStatus.NOT_FOUND, "This User is not exist");
  }
  if (user?.isDeleted) {
    throw new AppError(HttpStatus.FORBIDDEN, "This User is deleted");
  }

  if (user.expiresAt && new Date(user.expiresAt) < new Date()) {
    await UserModel.findOneAndUpdate(
      { email: user.email },
      {
        otp: null,
        expiresAt: null,
        isVerified: false,
      },
      { new: true },
    );
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "The Otp has expired. Try again!",
    );
  }
  const check = await checkOtp(payload.email, payload.otp);
  return check;
};

const resetPassword = async (payload: {
  email: string;
  newPassword: string;
}) => {
  const user = await UserModel.findOne({
    email: payload.email,
  });

  if (!user) {
    throw new AppError(HttpStatus.NOT_FOUND, "This User is not exist");
  }
  if (user?.isDeleted) {
    throw new AppError(HttpStatus.FORBIDDEN, "This User is deleted");
  }
  if (!user.isVerified) {
    throw new AppError(HttpStatus.BAD_REQUEST, "You are not verified");
  }

  const newHashedPassword = await UserModel.newHashedPassword(
    payload.newPassword,
  );
  const updateUser = await UserModel.findOneAndUpdate(
    { email: user.email },
    {
      password: newHashedPassword,
      passwordChangedAt: new Date(),
    },
    { new: true },
  );
  return updateUser;
};

const changePassword = async (
  userId: string | Types.ObjectId,
  payload: { currentPassword: string; newPassword: string },
) => {
  const id = new Types.ObjectId(userId);
  const user = await UserModel.findById(id).select("+password");
  if (!user) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }
  if (user.isDeleted) {
    throw new AppError(HttpStatus.FORBIDDEN, "User is blocked");
  }
  if (!payload.currentPassword || !payload.newPassword) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Password is missing");
  }
  // 2. Verify current password
  const isMatch = await bcrypt.compare(payload.currentPassword, user.password);
  if (!isMatch) {
    throw new AppError(
      HttpStatus.UNAUTHORIZED,
      "Current password is incorrect",
    );
  }
  const newPass = await bcrypt.hash(payload.newPassword, 12);
  const result = await UserModel.findByIdAndUpdate(
    user._id,
    {
      password: newPass,
      passwordChangedAt: new Date(),
    },
    { new: true },
  );
  if (!result) {
    throw new AppError(HttpStatus.UNAUTHORIZED, "Something went wrong");
  }
  return { message: "Change password successfull" };
};

const resendOtp = async (email: string) => {
  const user = await UserModel.findOne({ email });

  if (!user) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }

  if (user.isDeleted) {
    throw new AppError(HttpStatus.FORBIDDEN, "This user is deleted");
  }

  // Check if OTP exists and is still valid (not expired)
  if (user.expiresAt && new Date(user.expiresAt) > new Date()) {
    // OTP is still valid, throw an error because you cannot resend it yet
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "OTP is still valid. Please try again after it expires.",
    );
  } else {
    // OTP has expired or has not been set, generate a new OTP
    const otp = generateOtp(); // Generate new OTP
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 1); // Set OTP expiration to 1 minute from now
    // Save the new OTP and expiration time to the user's record
    const updatedUser = (await UserModel.findOneAndUpdate(
      { email },
      { otp, expiresAt },
      { new: true },
    ).select("-password -passwordChangedAt -otp")) as IUserWithPopulatedRole;

    // Send email with the new OTP
    const subject = "New Verification Code";
    const mail = await sendEmail(
      user.email,
      subject,
      verificationEmailTemplate(updatedUser.roleId.name as string, otp),
    );
    if (!mail) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "Something went wrong while sending the email!",
      );
    }
    return updatedUser;
  }
};

export const authServices = {
  loginUser,
  forgetPassword,
  resetPassword,
  changePassword,
  verifyOtp,
  resendOtp,
};
