import express from "express";
import auth from "../../middlewares/auth";
import { messageControllers } from "./message.controller";

const router = express.Router();

router.get(
  "/:chatId",
  auth("admin", "professional"),
  messageControllers.getMyMessages,
);
router.post(
  "/:chatId",
  auth("admin", "professional"),
  messageControllers.sendMessage,
);

export const MessageRoutes = router;
