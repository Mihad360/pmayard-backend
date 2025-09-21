import HttpStatus from "http-status";
import { JwtPayload } from "../../interface/global";
import sendResponse from "../../utils/sendResponse";
import { sessionServices } from "./session.service";
import catchAsync from "../../utils/catchAsync";

const getMySessions = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await sessionServices.getMySessions(user);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "session retrieved successfully",
    data: result,
  });
});

export const sessionControllers = {
  getMySessions,
};
