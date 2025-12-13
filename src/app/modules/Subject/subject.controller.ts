import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { subjectServices } from "./subject.service";

const addSubject = catchAsync(async (req, res) => {
  const id = req.params.subjectId;
  const result = await subjectServices.addSubject(id, req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Subject added successfully",
    data: result,
  });
});

const getSubjects = catchAsync(async (req, res) => {
  const id = req.params.gradeId;
  const result = await subjectServices.getSubjects(id, req.query);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Subjects retrieved successfully",
    meta: result.meta,
    data: result.result,
  });
});

const removeSubject = catchAsync(async (req, res) => {
  const id = req.params.subjectId;
  const result = await subjectServices.removeSubject(id);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Subject removed successfully",
    data: result,
  });
});

export const subjectControllers = {
  addSubject,
  getSubjects,
  removeSubject,
};
