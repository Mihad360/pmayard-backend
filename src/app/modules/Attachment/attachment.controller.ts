import HttpStatus from "http-status";
import { JwtPayload } from "../../interface/global";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { attachmentServices } from "./attachment.service";

const sendMessageByAttachment = catchAsync(async (req, res) => {
  const id = req.params.id;
  const user = req.user as JwtPayload;
  const result = await attachmentServices.sendMessageByAttachment(
    req.files as Express.Multer.File[],
    id,
    user,
    req.body,
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Message with attachment sent successfully",
    data: result,
  });
});

export const attachmentControllers = {
  sendMessageByAttachment,
};
