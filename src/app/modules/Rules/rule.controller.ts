import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { ruleServices } from "./rule.service";

const updateAboutUsById = catchAsync(async (req, res) => {
  const id = req.params.id;
  const result = await ruleServices.updateAboutUsById(id, req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "About us edit successfully",
    data: result,
  });
});

const updatePrivacyById = catchAsync(async (req, res) => {
  const id = req.params.id;
  const result = await ruleServices.updatePrivacyById(id, req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Privacy & concern edit successfully",
    data: result,
  });
});

const updateTermsById = catchAsync(async (req, res) => {
  const id = req.params.id;
  const result = await ruleServices.updateTermsById(id, req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Terms & condition edit successfully",
    data: result,
  });
});

export const ruleControllers = {
  updateAboutUsById,
  updatePrivacyById,
  updateTermsById,
};
