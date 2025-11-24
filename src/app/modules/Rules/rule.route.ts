import express from "express";
import auth from "../../middlewares/auth";
import { ruleControllers } from "./rule.controller";

const router = express.Router();

router.get(
  "/privacy/",
  auth("admin", "professional", "parent"),
  ruleControllers.getPrivacy,
);
router.get(
  "/terms/",
  auth("admin", "professional", "parent"),
  ruleControllers.getTerms,
);
router.get(
  "/aboutus/",
  auth("admin", "professional", "parent"),
  ruleControllers.getAboutUs,
);
router.patch(
  "/aboutus/:id",
  auth("admin", "professional", "parent"),
  ruleControllers.updateAboutUsById,
);
router.patch(
  "/privacy/:id",
  auth("admin", "professional", "parent"),
  ruleControllers.updatePrivacyById,
);
router.patch(
  "/terms/:id",
  auth("admin", "professional", "parent"),
  ruleControllers.updateTermsById,
);

export const RuleRoutes = router;
