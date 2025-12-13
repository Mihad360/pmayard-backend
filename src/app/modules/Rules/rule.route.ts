import express from "express";
import { ruleControllers } from "./rule.controller";

const router = express.Router();

router.get(
  "/privacy/",

  ruleControllers.getPrivacy,
);
router.get(
  "/terms/",

  ruleControllers.getTerms,
);
router.get(
  "/aboutus/",

  ruleControllers.getAboutUs,
);
router.patch(
  "/aboutus/:id",

  ruleControllers.updateAboutUsById,
);
router.patch(
  "/privacy/:id",

  ruleControllers.updatePrivacyById,
);
router.patch(
  "/terms/:id",

  ruleControllers.updateTermsById,
);

export const RuleRoutes = router;
