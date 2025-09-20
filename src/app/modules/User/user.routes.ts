import express from "express";
import { userControllers } from "./user.controller";
import validateRequest from "../../middlewares/validateRequest";
import { userValidationSchema } from "./user.validation";
import auth from "../../middlewares/auth";

const router = express.Router();

router.get(
  "/me",
  auth("admin", "parent", "professional"),
  userControllers.getMe,
);
router.post(
  "/register",
  validateRequest(userValidationSchema),
  userControllers.registerUser,
);

export const userRoutes = router;
