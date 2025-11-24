import express, { NextFunction, Request, Response } from "express";
import { userControllers } from "./user.controller";
import validateRequest from "../../middlewares/validateRequest";
import { userValidationSchema } from "./user.validation";
import auth from "../../middlewares/auth";
import { upload } from "../../utils/sendImageToCloudinary";

const router = express.Router();

router.get(
  "/me",
  auth("admin", "parent", "professional"),
  userControllers.getMe,
);
router.patch(
  "/edit-profile",
  auth("admin", "professional", "parent"),
  upload.single("image"),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body.data) {
      req.body = JSON.parse(req.body.data);
    }
    next();
  },
  userControllers.editUserProfile,
);
router.post(
  "/register",
  validateRequest(userValidationSchema),
  userControllers.registerUser,
);
router.delete(
  "/:id",
  auth("admin", "parent", "professional"),
  userControllers.deleteUser,
);
router.delete("/delete/:id", userControllers.removeUser);
router.post(
  "/role",
  auth("professional", "parent"),
  upload.single("image"),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body.data) {
      req.body = JSON.parse(req.body.data);
    }
    next();
  },
  userControllers.createRole,
);

export const userRoutes = router;
