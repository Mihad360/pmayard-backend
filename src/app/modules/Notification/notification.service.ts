import HttpStatus from "http-status";
import { INotification } from "./notification.interface";
import { NotificationModel } from "./notification.model";
import AppError from "../../erros/AppError";
import { UserModel } from "../User/user.model";
import { JwtPayload } from "../../interface/global";
import { ClientSession, Types } from "mongoose";

export const createNotification = async (
  payload: INotification,
  session?: ClientSession, // Typing session with Mongoose ClientSession
) => {
  try {
    if (!payload) {
      throw new AppError(HttpStatus.NOT_FOUND, "Response not found");
    }

    // Create notification with session to ensure it's part of the transaction
    const sendNot = await NotificationModel.create([payload], { session });

    if (!sendNot) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "Notification creation failed",
      );
    }

    return sendNot;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw new Error("Notification creation failed");
  }
};

const getMyNotifications = async (user: JwtPayload) => {
  const userId = new Types.ObjectId(user.user);

  // Check if user exists
  const isUserExist = await UserModel.findById(userId);
  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }

  let notifications;

  // Conditional logic based on user role
  if (user.role === "admin") {
    // Admin: Fetch user login notifications
    notifications = await NotificationModel.find({
      type: { $in: ["user_registration", "user_login", "user_join"] },
    })
      .sort({ createdAt: -1 })
      .populate({ path: "sender", select: "name" });
  } else if (user.role === "professional") {
    // Teacher: Fetch trip join notifications
    notifications = await NotificationModel.find({
      recipient: userId,
      type: "parent_assigned",
    }).sort({ createdAt: -1 });
  } else if (user.role === "parent") {
    // Participant: Fetch trip reminder notifications
    notifications = await NotificationModel.find({
      recipient: userId,
      type: "tutor_assigned",
    }).sort({ createdAt: -1 });
  } else {
    // Invalid role
    throw new AppError(HttpStatus.FORBIDDEN, "Invalid role");
  }

  if (!notifications || notifications.length === 0) {
    throw new AppError(HttpStatus.NOT_FOUND, "The notification not available");
  }

  return notifications;
};

const updateNotification = async (id: string) => {
  const isNotificationExist = await NotificationModel.findById(id);
  if (!isNotificationExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "The notification not available");
  }
  const notification = await NotificationModel.findByIdAndUpdate(
    isNotificationExist._id,
    {
      isRead: true,
    },
    { new: true },
  );
  return notification;
};

export const notificationServices = {
  updateNotification,
  getMyNotifications,
};
