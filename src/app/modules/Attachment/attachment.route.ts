import express, { Request, Response } from "express";
import { NextFunction } from "express";
import auth from "../../middlewares/auth";
import { upload } from "../../utils/sendImageToCloudinary";
import { attachmentControllers } from "./attachment.controller";

const router = express.Router();

router.post(
  "/:id/send-attachment",
  auth("professional", "parent", "admin"),
  upload.array("images"),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body.data) {
      req.body = JSON.parse(req.body.data);
    }
    next();
  },
  attachmentControllers.sendMessageByAttachment,
);

export const AttachmentRoutes = router;
