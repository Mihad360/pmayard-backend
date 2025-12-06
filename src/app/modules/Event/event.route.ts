import express from "express";
import { eventControllers } from "./event.controller";
import auth from "../../middlewares/auth";

const router = express.Router();

router.get(
  "/",
  auth("admin", "professional", "parent"),
  eventControllers.getAllEvents,
);
router.post("/add-event", auth("admin"), eventControllers.addEvent);
router.delete("/:eventId", auth("admin"), eventControllers.removeEvent);

export const EventRoutes = router;
