import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { materialServices } from "./material.service";

const addMaterial = catchAsync(async (req, res) => {
  const id = req.params.subjectId;
  const files = req.files as Express.Multer.File[];
  const result = await materialServices.addMaterial(id, req.body, files);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Material added successfully",
    data: result,
  });
});

const getMaterials = catchAsync(async (req, res) => {
  const id = req.params.subjectId;
  const result = await materialServices.getMaterials(id, req.query);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Materials retrieved successfully",
    meta: result.meta,
    data: result.result,
  });
});

const removeMaterial = catchAsync(async (req, res) => {
  const id = req.params.materialId;
  const result = await materialServices.removeMaterial(id);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Material removed successfully",
    data: result,
  });
});

export const materialControllers = {
  addMaterial,
  getMaterials,
  removeMaterial,
};
