import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { materialServices } from "./material.service";

const addMaterial = catchAsync(async (req, res) => {
  const id = req.params.subjectId;
  const file = req.file as Express.Multer.File;
  const result = await materialServices.addMaterial(id, req.body, file);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "data retrieved successfully",
    data: result,
  });
});

const getMaterials = catchAsync(async (req, res) => {
  const id = req.params.subjectId;
  const result = await materialServices.getMaterials(id, req.query);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "data retrieved successfully",
    meta: result.meta,
    data: result.result,
  });
});

export const materialControllers = {
  addMaterial,
  getMaterials,
};
