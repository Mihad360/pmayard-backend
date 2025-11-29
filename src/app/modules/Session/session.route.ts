import express from "express";
import auth from "../../middlewares/auth";
import { sessionControllers } from "./session.controller";
import validateRequest from "../../middlewares/validateRequest";
import { sessionStatusValidationSchema } from "./session.validation";

const router = express.Router();

router.get(
  "/upcoming-sessions",
  auth("professional", "parent"),
  sessionControllers.getUpcomingSessions,
);
router.get(
  "/assigned-roles",
  auth("parent", "professional"),
  sessionControllers.getAssignedProfiles,
);
router.get(
  "/my-sessions",
  auth("parent", "professional"),
  sessionControllers.getMySessions,
);
router.get(
  "/:sessionId",
  auth("admin", "professional", "parent"),
  sessionControllers.getEachSession,
);
router.get(
  "/:roleId/role",
  auth("admin", "professional", "parent"),
  sessionControllers.getEachRole,
);
router.patch(
  "/:sessionId/status",
  auth("parent", "professional"),
  validateRequest(sessionStatusValidationSchema),
  sessionControllers.updateSessionStatus,
);

export const SessionRoutes = router;
