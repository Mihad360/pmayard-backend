import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import { authServices } from "./auth.service";
import sendResponse from "../../utils/sendResponse";
import { Types } from "mongoose";
import { JwtPayload } from "../../interface/global";

const loginUser = catchAsync(async (req, res) => {
  const result = await authServices.loginUser(req.body);
  const { accessToken, role, _id } = result;

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 365 * 60 * 60 * 7,
  });

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Logged in successfully",
    data: {
      _id,
      role,
      accessToken,
    },
  });
});

const forgetPassword = catchAsync(async (req, res) => {
  const result = await authServices.forgetPassword(req.body.email);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset email sent successfully",
    data: result,
  });
});

const verifyOtp = catchAsync(async (req, res) => {
  const result = await authServices.verifyOtp(req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "OTP verified successfully",
    data: result,
  });
});

const resetPassword = catchAsync(async (req, res) => {
  const result = await authServices.resetPassword(req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset successfully",
    data: result,
  });
});

const changePassword = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const userId = new Types.ObjectId(user.user);
  const result = await authServices.changePassword(userId, req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password changed successfully",
    data: result,
  });
});

export const authControllers = {
  loginUser,
  forgetPassword,
  verifyOtp,
  resetPassword,
  changePassword,
};
