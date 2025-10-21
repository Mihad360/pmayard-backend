import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { conversationServices } from "./conversation.service";
import { JwtPayload } from "../../interface/global";

const getMyConversations = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;

  const filterParams = {
    type: typeof req.query.type === "string" ? req.query.type : undefined,
  };

  const result = await conversationServices.getMyConversations(
    user,
    filterParams,
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Conversations fetched successfully",
    data: result,
  });
});

const getEachConversation = catchAsync(async (req, res) => {
  const id = req.params.conversationId;
  const user = req.user as JwtPayload;
  const result = await conversationServices.getEachConversation(id, user);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Conversation retrieved successfully",
    data: result,
  });
});

export const conversationControllers = {
  getMyConversations,
  getEachConversation,
};
