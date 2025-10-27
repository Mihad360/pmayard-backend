import { model, Schema } from "mongoose";
import { IAboutUs, IPrivacy, ITerms } from "./rule.interface";

const privacySchema = new Schema<IPrivacy>(
  {
    title: {
      type: String,
    },
    content: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

const termsSchema = new Schema<ITerms>(
  {
    title: {
      type: String,
    },
    content: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

const aboutUsSchema = new Schema<IAboutUs>(
  {
    title: {
      type: String,
    },
    content: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

export const PrivacyModel = model<IPrivacy>("Privacy", privacySchema);
export const TermsModel = model<ITerms>("Terms", termsSchema);
export const AboutUsModel = model<IAboutUs>("AboutUs", aboutUsSchema);
