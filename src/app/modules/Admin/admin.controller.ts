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
    message: "data retrieved successfully",
    meta: result.meta,
    data: result.result,
  });
});

const getAllProfessionals = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await adminServices.getAllProfessionals(user, req.query);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "data retrieved successfully",
    meta: result.meta,
    sessions: result.sessions,
    data: result.result,
  });
});

const getAllSessions = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await adminServices.getAllSessions(user, req.query);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "data retrieved successfully",
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
    message: "data retrieved successfully",
    data: result,
  });
});

const assignProfessional = catchAsync(async (req, res) => {
  const id = req.params.parentId;
  const result = await adminServices.assignProfessional(id, req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "data retrieved successfully",
    data: result,
  });
});

const setCodeForSession = catchAsync(async (req, res) => {
  const id = req.params.sessionId;
  const result = await adminServices.setCodeForSession(id, req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "data retrieved successfully",
    data: result,
  });
});

const assignProfessionalAndSetCode = catchAsync(async (req, res) => {
  const id1 = req.params.parentId;
  const id2 = req.params.professionalId;
  const result = await adminServices.assignProfessionalAndSetCode(
    id1,
    id2,
    req.body,
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "data retrieved successfully",
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
};
