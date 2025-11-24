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
    message: "Message sent successfully",
    data: result,
  });
});

const getMessages = catchAsync(async (req, res) => {
  const conversationId = req.params.conversationId;
  const user = req.user as JwtPayload;
  const result = await messageServices.getMessages(conversationId, user);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Messages retrieved successfully",
    data: result.data,
  });
});

export const messageControllers = {
  sendMessageText,
  getMessages,
};
