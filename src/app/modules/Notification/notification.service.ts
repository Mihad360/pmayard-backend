import HttpStatus from "http-status";
import { INotification } from "./notification.interface";
import { NotificationModel } from "./notification.model";
import AppError from "../../erros/AppError";

export const createAdminNotification = async (payload: INotification) => {
  try {
    if (!payload) {
      throw new AppError(HttpStatus.NOT_FOUND, "Response not found");
    }
    const sendNot = await NotificationModel.create(payload);
    if (!sendNot) {
      throw new AppError(HttpStatus.BAD_REQUEST, "Notification create failed");
    }
    return sendNot;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw new Error("Notification creation failed");
  }
};
