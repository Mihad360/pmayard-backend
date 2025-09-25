import express from "express";
import auth from "../../middlewares/auth";
import { gradeControllers } from "./grade.controller";

const router = express.Router();

router.post("/add-grade", auth("admin"), gradeControllers.addGrade);
router.get("/", auth("admin", "professional"), gradeControllers.getGrades);

export const GradeRoutes = router;
