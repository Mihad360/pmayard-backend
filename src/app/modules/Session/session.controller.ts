import HttpStatus from "http-status";
import { JwtPayload } from "../../interface/global";
import sendResponse from "../../utils/sendResponse";
import { sessionServices } from "./session.service";
import catchAsync from "../../utils/catchAsync";

const getMySessions = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await sessionServices.getMySessions(user, req.query);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Sessions retrieved successfully",
    meta: result.meta,
    data: result.result,
  });
});

const updateSessionStatus = catchAsync(async (req, res) => {
  const id = req.params.sessionId;
  const result = await sessionServices.updateSessionStatus(id, req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Session status updated successfully",
    data: result,
  });
});

const getEachSession = catchAsync(async (req, res) => {
  const id = req.params.sessionId;
  const result = await sessionServices.getEachSession(id);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Session details retrieved successfully",
    data: result,
  });
});

const getAssignedProfiles = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await sessionServices.getAssignedProfiles(user);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Assigned professionals retrieved successfully",
    data: result,
  });
});

const getUpcomingSessions = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await sessionServices.getUpcomingSessions(user, req.query);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Upcoming parent sessions retrieved successfully",
    meta: result.meta,
    data: result.result,
  });
});

const getEachRole = catchAsync(async (req, res) => {
  const id = req.params.roleId;
  const user = req.user as JwtPayload;
  const result = await sessionServices.getEachRole(id, user);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Parent details retrieved successfully",
    data: result,
  });
});

export const sessionControllers = {
  getMySessions,
  updateSessionStatus,
  getEachSession,
  getAssignedProfiles,
  getUpcomingSessions,
  getEachRole,
};
