import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { parentServices } from "./parent.service";
import { JwtPayload } from "../../interface/global";

const createParent = catchAsync(async (req, res) => {
  const file = req.file as Express.Multer.File;
  const user = req.user as JwtPayload;
  const result = await parentServices.createParent(file, user, req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Parent created successfully",
    data: result,
  });
});

const verifySessionByCode = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await parentServices.verifySessionByCode(user, req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Parent created successfully",
    data: result,
  });
});

const getEachParent = catchAsync(async (req, res) => {
  const id = req.params.parentId;
  const result = await parentServices.getEachParent(id);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Session confirmed successfully",
    data: result,
  });
});

const getAssignedProfessionals = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await parentServices.getAssignedProfessionals(user);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Session confirmed successfully",
    data: result,
  });
});

const getUpcomingProfessionalSessions = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await parentServices.getUpcomingProfessionalSessions(user);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Session confirmed successfully",
    data: result,
  });
});

export const parentControllers = {
  createParent,
  verifySessionByCode,
  getEachParent,
  getAssignedProfessionals,
  getUpcomingProfessionalSessions,
};
