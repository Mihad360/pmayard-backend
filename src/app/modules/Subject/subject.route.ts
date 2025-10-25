import express from "express";
import auth from "../../middlewares/auth";
import { subjectControllers } from "./subject.controller";

const router = express.Router();

router.post(
  "/:subjectId/add-subject",
  auth("admin"),
  subjectControllers.addSubject,
);
router.get(
  "/:gradeId",
  auth("admin", "professional"),
  subjectControllers.getSubjects,
);
router.delete(
  "/:subjectId",
  auth("admin", "professional"),
  subjectControllers.removeSubject,
);

export const SubjectRoutes = router;
