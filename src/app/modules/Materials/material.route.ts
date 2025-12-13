import express, { NextFunction, Request, Response } from "express";
import auth from "../../middlewares/auth";
import { materialControllers } from "./material.controller";
import { upload } from "../../utils/sendImageToCloudinary";

const router = express.Router();

router.get(
  "/:subjectId",
  auth("admin", "professional"),
  materialControllers.getMaterials,
);
router.delete(
  "/:materialId",
  auth("admin", "professional"),
  materialControllers.removeMaterial,
);
router.post(
  "/add-material/:subjectId",
  auth("admin"),
  upload.array("file"),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body.data) {
      req.body = JSON.parse(req.body.data);
    }
    next();
  },
  materialControllers.addMaterial,
);

export const MaterialRoutes = router;
