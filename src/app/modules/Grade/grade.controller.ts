import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { gradeServices } from "./grade.service";

const addGrade = catchAsync(async (req, res) => {
  const result = await gradeServices.addGrade(req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "data retrieved successfully",
    data: result,
  });
});

const getGrades = catchAsync(async (req, res) => {
  const result = await gradeServices.getGrades(req.query);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "data retrieved successfully",
    meta: result.meta,
    data: result.result,
  });
});

export const gradeControllers = {
  addGrade,
  getGrades,
};
