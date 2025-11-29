import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { professionalServices } from "./professional.service";
import { JwtPayload } from "../../interface/global";

const createProfessional = catchAsync(async (req, res) => {
  const file = req.file as Express.Multer.File;
  const user = req.user as JwtPayload;
  const result = await professionalServices.createProfessional(
    file,
    user,
    req.body,
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Professional created successfully",
    data: result,
  });
});

const confirmSession = catchAsync(async (req, res) => {
  const id = req.params.sessionId;
  const result = await professionalServices.confirmSession(id, req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Session confirmed successfully",
    data: result,
  });
});

const getAssignedParents = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await professionalServices.getAssignedParents(user);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Assigned parents retrieved successfully",
    data: result,
  });
});

const getEachProfessional = catchAsync(async (req, res) => {
  const id = req.params.professionalId;
  const result = await professionalServices.getEachProfessional(id);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Professional details retrieved successfully",
    data: result,
  });
});

const editAvailability = catchAsync(async (req, res) => {
  const id = req.params.roleId;
  const result = await professionalServices.editAvailability(id, req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Professional details retrieved successfully",
    data: result,
  });
});

const getUpcomingParentSessions = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await professionalServices.getUpcomingParentSessions(
    user,
    req.query,
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Upcoming parent sessions retrieved successfully",
    meta: result.meta,
    data: result.result,
  });
});

export const professionalControllers = {
  createProfessional,
  confirmSession,
  getAssignedParents,
  getEachProfessional,
  getUpcomingParentSessions,
  editAvailability,
};
