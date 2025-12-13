import HttpStatus from "http-status";
import AppError from "../../erros/AppError";
import { AboutUsModel, PrivacyModel, TermsModel } from "./rule.model";
import { IAboutUs, IPrivacy, ITerms } from "./rule.interface";

const updatePrivacyById = async (id: string, payload: Partial<IPrivacy>) => {
  try {
    const updatedPrivacy = await PrivacyModel.findByIdAndUpdate(
      id,
      payload,
      { new: true }, // Returns the updated document
    );

    if (!updatedPrivacy) {
      throw new AppError(HttpStatus.BAD_REQUEST, "Update failed");
    }
    return updatedPrivacy;
  } catch (error) {
    console.error("Error updating Privacy policy:", error);
  }
};

const updateTermsById = async (id: string, payload: Partial<ITerms>) => {
  try {
    const updatedTerms = await TermsModel.findByIdAndUpdate(id, payload, {
      new: true,
      upsert: true,
    });

    if (!updatedTerms) {
      throw new AppError(HttpStatus.BAD_REQUEST, "Update failed");
    }
    return updatedTerms;
  } catch (error) {
    console.error("Error updating Terms:", error);
  }
};

const updateAboutUsById = async (id: string, payload: Partial<IAboutUs>) => {
  try {
    const updatedAboutUs = await AboutUsModel.findByIdAndUpdate(
      id,
      payload,
      { new: true }, // Returns the updated document
    );

    if (!updatedAboutUs) {
      throw new AppError(HttpStatus.BAD_REQUEST, "Update failed");
    }
    return updatedAboutUs;
  } catch (error) {
    console.error("Error updating About Us document:", error);
  }
};

const getPrivacy = async () => {
  const result = await PrivacyModel.find();
  return result;
};
const getTerms = async () => {
  const result = await TermsModel.find();
  return result;
};
const getAboutUs = async () => {
  const result = await AboutUsModel.find();
  return result;
};

export const ruleServices = {
  updateAboutUsById,
  updatePrivacyById,
  updateTermsById,
  getPrivacy,
  getTerms,
  getAboutUs,
};
