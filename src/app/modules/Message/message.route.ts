import express from "express";
import auth from "../../middlewares/auth";
import { messageControllers } from "./message.controller";

const router = express.Router();

router.get(
  "/group/:conversationId",
  auth("admin", "professional", "parent"),
  messageControllers.getGroupMessagesForEveryone,
);
router.get(
  "/:conversationId",
  auth("admin", "professional", "parent"),
  messageControllers.getAllMessage,
);
router.post(
  "/:conversationId/send-message",
  auth("admin", "professional", "parent"),
  messageControllers.sendMessageText,
);

export const MessageRoutes = router;
