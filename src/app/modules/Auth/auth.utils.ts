import HttpStatus from "http-status";
import AppError from "../../erros/AppError";
import { UserModel } from "../User/user.model";

export const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
};

export const verificationEmailTemplate = (email: string, otp: string) => {
  return `
    <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
      <h2>Email Verification</h2>
      <p>Hi <b>${email}</b>,</p>
      <p>Use the following verification code to complete your signup:</p>
      <h1 style="color: #4CAF50;">${otp}</h1>
      <p>This code will expire in <b>5 minutes</b>.</p>
    </div>
  `;
};

export const checkOtp = async (email: string, otp: string) => {
  // Find user
  const otpUser = await UserModel.findOne({ email });
  if (!otpUser) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }

  // Validate OTP
  if (otpUser.otp !== otp) {
    // Just throw error. Do NOT delete user.
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Invalid OTP. Please try again.",
    );
  }

  // OTP correct → verify user
  const updateUser = await UserModel.findOneAndUpdate(
    { email },
    {
      otp: null,
      expiresAt: null,
      isVerified: true,
    },
    { new: true },
  ).select("-password");

  return updateUser;
};
