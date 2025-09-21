import express, { NextFunction, Request, Response } from "express";
import auth from "../../middlewares/auth";
import { parentControllers } from "./parent.controller";
import { upload } from "../../utils/sendImageToCloudinary";

const router = express.Router();

router.post(
  "/parent",
  auth("parent"),
  upload.single("image"),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body.data) {
      req.body = JSON.parse(req.body.data);
    }
    next();
  },
  parentControllers.createParent,
);

export const ParentRoutes = router;
