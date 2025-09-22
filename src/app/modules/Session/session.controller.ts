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

const updateSessionStatus = catchAsync(async (req, res) => {
  const id = req.params.sessionId;
  const result = await sessionServices.updateSessionStatus(id, req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "session retrieved successfully",
    data: result,
  });
});

const getEachSession = catchAsync(async (req, res) => {
  const id = req.params.sessionId;
  const result = await sessionServices.getEachSession(id);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Session confirmed successfully",
    data: result,
  });
});

export const sessionControllers = {
  getMySessions,
  updateSessionStatus,
  getEachSession,
};
