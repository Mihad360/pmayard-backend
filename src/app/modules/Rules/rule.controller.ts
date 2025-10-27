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
    message: "About us updated successfully",
    data: result,
  });
});

const updatePrivacyById = catchAsync(async (req, res) => {
  const id = req.params.id;
  const result = await ruleServices.updatePrivacyById(id, req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Privacy & policy updated successfully",
    data: result,
  });
});

const updateTermsById = catchAsync(async (req, res) => {
  const id = req.params.id;
  const result = await ruleServices.updateTermsById(id, req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Terms & conditions updated successfully",
    data: result,
  });
});

const getPrivacy = catchAsync(async (req, res) => {
  const result = await ruleServices.getPrivacy();

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Privacy policy retrieved successfully",
    data: result,
  });
});

const getTerms = catchAsync(async (req, res) => {
  const result = await ruleServices.getTerms();

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Terms & conditions retrieved successfully",
    data: result,
  });
});

const getAboutUs = catchAsync(async (req, res) => {
  const result = await ruleServices.getAboutUs();

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "About us retrieved successfully",
    data: result,
  });
});

export const ruleControllers = {
  updateAboutUsById,
  updatePrivacyById,
  updateTermsById,
  getPrivacy,
  getAboutUs,
  getTerms,
};
