import express from "express";
import { conversationControllers } from "./conversation.controller";
import auth from "../../middlewares/auth";

const router = express.Router();

router.get(
  "/",
  auth("admin", "professional", "parent"),
  conversationControllers.getMyConversations,
);
router.get(
  "/:conversationId",
  auth("admin", "professional", "parent"),
  conversationControllers.getEachConversation,
);

export const ConversationRoutes = router;
