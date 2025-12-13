import express from "express";
import auth from "../../middlewares/auth";
import { adminControllers } from "./admin.controller";

const router = express.Router();

router.get(
  "/parent-assigned-professionals/:parentId",
  auth("admin"),
  adminControllers.getAllParentAssignedProfessionals,
);
router.get("/session-stats", auth("admin"), adminControllers.getDashboardData);
router.get("/parents", auth("admin"), adminControllers.getAllParents);
router.get("/sessions", auth("admin"), adminControllers.getAllSessions);
router.get(
  "/professionals",
  auth("admin"),
  adminControllers.getAllProfessionals,
);
router.get("/parents/:id", auth("admin"), adminControllers.getEachParent);
router.post(
  "/:parentId/assign-professional",
  auth("admin"),
  adminControllers.assignProfessional,
);
router.post(
  "/:sessionId/set-session-code",
  auth("admin"),
  adminControllers.setCodeForSession,
);
router.post(
  "/:parentId/:professionalId/assign-professional",
  auth("admin"),
  adminControllers.assignProfessionalAndSetCode,
);
router.delete(
  "/session/:sessionId",
  auth("admin"),
  adminControllers.removeSession,
);

export const AdminRoutes = router;
