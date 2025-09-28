import express from "express";
import { eventControllers } from "./event.controller";
import auth from "../../middlewares/auth";

const router = express.Router();

router.get("/", auth("admin", "professional"), eventControllers.getAllEvents);
router.post("/add-event", auth("admin"), eventControllers.addEvent);

export const EventRoutes = router;
