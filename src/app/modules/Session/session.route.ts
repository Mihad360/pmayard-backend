import express from "express";
import auth from "../../middlewares/auth";
import { sessionControllers } from "./session.controller";

const router = express.Router();

router.get(
  "/my-sessions",
  auth("parent", "professional"),
  sessionControllers.getMySessions,
);

export const SessionRoutes = router;
