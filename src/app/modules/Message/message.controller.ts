import HttpStatus from "http-status";
import { JwtPayload } from "../../interface/global";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { messageServices } from "./message.service";

const sendMessageText = catchAsync(async (req, res) => {
  const conversationId = req.params.conversationId;
  const user = req.user as JwtPayload;
  const result = await messageServices.sendMessageText(
    conversationId,
    user,
    req.body,
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "data retrieved successfully",
    data: result,
  });
});

const getAllMessage = catchAsync(async (req, res) => {
  const conversationId = req.params.conversationId;
  const user = req.user as JwtPayload;
  const result = await messageServices.getAllMessage(conversationId, user);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "data retrieved successfully",
    data: result,
  });
});

const getGroupMessagesForEveryone = catchAsync(async (req, res) => {
  const conversationId = req.params.conversationId;
  const user = req.user as JwtPayload;
  const result = await messageServices.getGroupMessagesForEveryone(
    conversationId,
    user,
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "data retrieved successfully",
    data: result,
  });
});

export const messageControllers = {
  sendMessageText,
  getAllMessage,
  getGroupMessagesForEveryone,
};
