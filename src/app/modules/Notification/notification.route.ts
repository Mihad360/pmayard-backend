import express from "express";
import auth from "../../middlewares/auth";
import { notificationControllers } from "./notification.controller";

const router = express.Router();

router.get(
  "/",
  auth("admin", "professional", "parent"),
  notificationControllers.getMyNotifications,
);
router.put(
  "/:id",
  auth("admin", "parent", "professional"),
  notificationControllers.updateNotification,
);

export const NotificationRoutes = router;
