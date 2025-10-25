import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { adminServices } from "./admin.service";
import { JwtPayload } from "../../interface/global";

const getAllParents = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await adminServices.getAllParents(user, req.query);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Parents retrieved successfully",
    data: result,
  });
});

const getAllProfessionals = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await adminServices.getAllProfessionals(user, req.query);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Professionals retrieved successfully",
    data: result,
  });
});

const getAllSessions = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await adminServices.getAllSessions(user, req.query);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Sessions retrieved successfully",
    meta: result.meta,
    data: result.result,
  });
});

const getEachParent = catchAsync(async (req, res) => {
  const id = req.params.id;
  const result = await adminServices.getEachParent(id);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Parent details retrieved successfully",
    data: result,
  });
});

const assignProfessional = catchAsync(async (req, res) => {
  const id = req.params.parentId;
  const result = await adminServices.assignProfessional(id, req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Professional assigned successfully",
    data: result,
  });
});

const setCodeForSession = catchAsync(async (req, res) => {
  const id = req.params.sessionId;
  const result = await adminServices.setCodeForSession(id, req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Session code set successfully",
    data: result,
  });
});

const assignProfessionalAndSetCode = catchAsync(async (req, res) => {
  const id1 = req.params.parentId;
  const id2 = req.params.professionalId;
  const user = req.user as JwtPayload;
  const result = await adminServices.assignProfessionalAndSetCode(
    id1,
    id2,
    req.body,
    user.user as string,
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Professional assigned and session code set successfully",
    data: result,
  });
});

const getAllParentAssignedProfessionals = catchAsync(async (req, res) => {
  const id = req.params.parentId;
  const result = await adminServices.getAllParentAssignedProfessionals(id);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Parent's assigned professionals retrieved successfully",
    data: result,
  });
});

const removeSession = catchAsync(async (req, res) => {
  const id = req.params.sessionId;
  const result = await adminServices.removeSession(id);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Session removed successfully",
    data: result,
  });
});

const getDashboardData = catchAsync(async (req, res) => {
  const { year } = req.query;

  // Ensure 'year' is passed as a number if it's present
  const parsedYear = year ? parseInt(year as string, 10) : undefined;
  const result = await adminServices.getDashboardData(parsedYear);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Dashboard data retrieved successfully",
    data: result,
  });
});

export const adminControllers = {
  getAllParents,
  getAllProfessionals,
  getEachParent,
  assignProfessional,
  setCodeForSession,
  getAllSessions,
  assignProfessionalAndSetCode,
  getAllParentAssignedProfessionals,
  removeSession,
  getDashboardData,
};
