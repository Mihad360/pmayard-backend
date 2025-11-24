import express, { NextFunction, Request, Response } from "express";
import auth from "../../middlewares/auth";
import { parentControllers } from "./parent.controller";
import { upload } from "../../utils/sendImageToCloudinary";

const router = express.Router();

router.get(
  "/assigned-roles",
  auth("parent", "professional"),
  parentControllers.getAssignedProfiles,
);
router.get(
  "/upcoming-professional-sessions",
  auth("parent"),
  parentControllers.getUpcomingProfessionalSessions,
);
router.get(
  "/:parentId",
  auth("admin", "professional", "parent"),
  parentControllers.getEachParent,
);
router.post(
  "/parent",
  auth("parent"),
  upload.single("image"),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body.data) {
      req.body = JSON.parse(req.body.data);
    }
    next();
  },
  parentControllers.createParent,
);
router.post(
  "/verify-session",
  auth("parent"),
  parentControllers.verifySessionByCode,
);

export const ParentRoutes = router;
