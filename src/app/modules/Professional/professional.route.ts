import express, { NextFunction, Request, Response } from "express";
import auth from "../../middlewares/auth";
import { professionalControllers } from "./professional.controller";
import { upload } from "../../utils/sendImageToCloudinary";

const router = express.Router();

router.get(
  "/upcoming-parent-sessions",
  auth("professional"),
  professionalControllers.getUpcomingParentSessions,
);
router.get(
  "/assigned-parents",
  auth("professional"),
  professionalControllers.getAssignedParents,
);
router.get(
  "/:professionalId",
  auth("admin", "professional", "parent"),
  professionalControllers.getEachProfessional,
);
router.post(
  "/professional",
  auth("professional"),
  upload.single("image"),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body.data) {
      req.body = JSON.parse(req.body.data);
    }
    next();
  },
  professionalControllers.createProfessional,
);
router.post(
  "/:sessionId/confirm-session",
  auth("professional"),
  professionalControllers.confirmSession,
);
router.patch(
  "/:roleId/availability",
  auth("professional"),
  professionalControllers.editAvailability,
);

export const ProfessionalRoutes = router;
