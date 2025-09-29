import HttpStatus from "http-status";
import { JwtPayload } from "../../interface/global";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { messageServices } from "./message.service";

const sendMessage = catchAsync(async (req, res) => {
  const chatId = req.params.chatId;
  const user = req.user as JwtPayload;
  const userId = user.user as string;
  const result = await messageServices.sendMessage(req.body, userId, chatId);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "data retrieved successfully",
    data: result,
  });
});

const getMyMessages = catchAsync(async (req, res) => {
  const chatId = req.params.chatId;
  const user = req.user as JwtPayload;
  const userId = user.user as string;
  const result = await messageServices.getMyMessages(userId, chatId);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "data retrieved successfully",
    data: result,
  });
});

export const messageControllers = {
  sendMessage,
  getMyMessages,
};
