import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { userServices } from "./user.service";
import { JwtPayload } from "../../interface/global";

const registerUser = catchAsync(async (req, res) => {
  const result = await userServices.registerUser(req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "User registered successfully",
    data: result,
  });
});

const getMe = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await userServices.getMe(user);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "User profile retrieved successfully",
    data: result,
  });
});

const editUserProfile = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const id = user.user as string;
  const file = req.file as Express.Multer.File;
  const result = await userServices.editUserProfile(id, file, req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "User edit succesfully",
    data: result,
  });
});

const deleteUser = catchAsync(async (req, res) => {
  const id = req.params.id;
  const result = await userServices.deleteUser(id);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "User deleted succesfully",
    data: result,
  });
});

export const userControllers = {
  registerUser,
  getMe,
  editUserProfile,
  deleteUser,
};
