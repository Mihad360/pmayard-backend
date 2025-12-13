import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { gradeServices } from "./grade.service";

const addGrade = catchAsync(async (req, res) => {
  const result = await gradeServices.addGrade(req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Grade added successfully",
    data: result,
  });
});

const getGrades = catchAsync(async (req, res) => {
  const result = await gradeServices.getGrades(req.query);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Grades retrieved successfully",
    meta: result.meta,
    data: result.result,
  });
});

const removeGrade = catchAsync(async (req, res) => {
  const id = req.params.gradeId;
  const result = await gradeServices.removeGrade(id);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Grade removed successfully",
    data: result,
  });
});

export const gradeControllers = {
  addGrade,
  getGrades,
  removeGrade,
};
