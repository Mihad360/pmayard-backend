import express from "express";
import auth from "../../middlewares/auth";
import { ruleControllers } from "./rule.controller";

const router = express.Router();

router.get("/privacy/", auth("admin"), ruleControllers.getPrivacy);
router.get("/terms/", auth("admin"), ruleControllers.getTerms);
router.get("/aboutus/", auth("admin"), ruleControllers.getAboutUs);
router.patch("/aboutus/:id", auth("admin"), ruleControllers.updateAboutUsById);
router.patch("/privacy/:id", auth("admin"), ruleControllers.updatePrivacyById);
router.patch("/terms/:id", auth("admin"), ruleControllers.updateTermsById);

export const RuleRoutes = router;
