/* eslint-disable @typescript-eslint/no-explicit-any */
import HttpStatus from "http-status";
import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import mongoose from "mongoose";
import express, { Application } from "express";
import AppError from "../erros/AppError";
import { verifyToken } from "./jwt";
import config from "../config";
import { UserModel } from "../modules/User/user.model";
import { NotificationModel } from "../modules/Notification/notification.model";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const app: Application = express();

declare module "socket.io" {
  interface Socket {
    user?: {
      _id: string;
      name?: string;
      email: string;
      role: string;
    };
  }
}

// Initialize the Socket.IO server
let io: SocketIOServer;
export const connectedUsers = new Map<string, { socketID: string }>();
export const connectedClients = new Map<string, Socket>();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const sendResponse = (
  statusCode: number,
  status: string,
  message: string,
  data?: any,
) => ({
  statusCode,
  status,
  message,
  data,
});

export const initSocketIO = async (server: HttpServer): Promise<void> => {
  console.log("🔧 Initializing Socket.IO server 🔧");

  const { Server } = await import("socket.io");

  io = new Server(server, {
    cors: {
      origin: "*", // Replace with your client's origin
      methods: ["GET", "POST"],
      allowedHeaders: ["my-custom-header"], // Add any custom headers if needed
      credentials: true,
    },
  });

  console.log("🎉 Socket.IO server initialized! 🎉");

  // Authentication middleware: now takes the token from headers.
  io.use(async (socket: Socket, next: (err?: any) => void) => {
    const token = socket.handshake.headers.token as string;

    if (!token) {
      return next(new AppError(HttpStatus.UNAUTHORIZED, "Token missing"));
    }

    // Verify the token
    const userDetails = verifyToken(token, config.jwt_access_secret as string);
    if (!userDetails) {
      return next(new Error("Authentication error: Invalid token"));
    }

    const user = await UserModel.findById(userDetails.user).select(
      "_id name email role",
    );
    if (!user) {
      return next(new Error("Authentication error: User not found"));
    }

    // Attach user data to the socket object
    socket.user = {
      _id: user._id.toString(),
      email: user.email,
      role: user.role as string,
    };

    // Store the socket ID in the connectedUsers map
    connectedUsers.set(socket.user._id.toString(), { socketID: socket.id });

    next();
  });

  io.on("connection", (socket: Socket) => {
    console.log("Socket just connected:", {
      socketId: socket.id,
      userId: socket.user?._id,
      name: socket.user?.name,
      email: socket.user?.email,
      role: socket.user?.role,
    });

    socket.on("userConnected", ({ userId }: { userId: string }) => {
      connectedUsers.set(userId, { socketID: socket.id });
      console.log(`User ${userId} connected with socket ID: ${socket.id}`);
    });

    if (socket.user && socket.user._id) {
      connectedUsers.set(socket.user._id.toString(), { socketID: socket.id });
      console.log(
        `Registered user ${socket.user._id.toString()} with socket ID: ${socket.id}`,
      );
    }

    socket.on("disconnect", () => {
      console.log(
        `${socket.user?.name} || ${socket.user?.email} || ${socket.user?._id} just disconnected with socket ID: ${socket.id}`,
      );

      for (const [key, value] of connectedUsers.entries()) {
        if (value.socketID === socket.id) {
          connectedUsers.delete(key);
          break;
        }
      }
    });
  });
};

// Export the Socket.IO instance
export { io };

export const emitNotification = async ({
  userId,
  adminMsgTittle,
  userMsgTittle,
  userMsg,
  adminMsg,
}: {
  userId: mongoose.Types.ObjectId;
  userMsgTittle: string;
  adminMsgTittle: string;
  userMsg?: string;
  adminMsg?: string;
}): Promise<void> => {
  if (!io) {
    throw new Error("Socket.IO is not initialized");
  }

  const userSocket = connectedUsers.get(userId.toString());

  const admins = await UserModel.find({ role: "admin" }).select("_id");
  const adminIds = admins.map((admin) => admin._id.toString());

  if (userMsg && userSocket) {
    io.to(userSocket.socketID).emit(`notification`, {
      userId,
      message: userMsg,
    });
  }

  if (adminMsg) {
    adminIds.forEach((adminId) => {
      const adminSocket = connectedUsers.get(adminId);
      if (adminSocket) {
        io.to(adminSocket.socketID).emit(`notification`, {
          adminId,
          message: adminMsg,
        });
      }
    });
  }

  await NotificationModel.create({
    userId,
    userMsg,
    adminId: adminIds,
    adminMsg,
    adminMsgTittle,
    userMsgTittle,
  });
};

// Teacher requests location of a specific user
export const emitLocationRequest = async (userId: string) => {
  // Ensure Socket.IO is initialized
  if (!io) {
    throw new Error("Socket.IO is not initialized");
  }

  // Find the user's socket connection in the map
  const userSocket = connectedUsers.get(userId);
  console.log("SOCEKT", userSocket);
  if (userSocket) {
    // Emit location request to the specific user's socket
    io.to(userSocket.socketID).emit("locationRequest", {
      userId, // Send the userId to match the request
      status: "requesting-location", // Custom status for the request
    });

    console.log(`Location request sent to user ${userId}`);
  } else {
    console.log(`User with ID ${userId} is not connected via Socket.IO`);
  }
};

export const emitLocationLatLong = async (data: any) => {
  try {
    const userSocket = connectedUsers.get(data.userId?.toString());
    console.log(userSocket);
    if (userSocket) {
      io.to(userSocket.socketID).emit("locationUpdated", {
        userId: data.userId,
        latitude: data.latitude,
        longitude: data.longitude,
        isTrackingEnabled: data.isTrackingEnabled,
        time: data.time,
      });
      console.log("doneee");
    } else {
      console.log(`User ${data.userId} is not connected.`);
    }
  } catch (error) {
    console.error("Error in location update:", error);
  }
};

export const emitMessageData = ({
  conversationId,
  senderId,
  messageContent,
  attachment,
  messageType,
}: {
  conversationId: string;
  senderId: string;
  messageContent?: string;
  attachment?:
    | {
        id: string;
        fileUrl: string;
        mimeType: string;
        fileName: string;
      }[]
    | null;
  messageType: string;
}) => {
  if (!io) {
    throw new Error("Socket.IO is not initialized");
  }

  // Base message object (same for everyone)
  const message = {
    sender_id: senderId,
    lastMessage: messageContent ? messageContent : null,
    attachment: attachment ? attachment : null,
    message_type: messageType,
    timestamp: new Date().toISOString(),
  };

  if (message) {
    const personalizedData = {
      conversationId,
      message,
    };

    io.emit(`new_message-${conversationId}`, personalizedData);
  } else {
    throw new AppError(HttpStatus.BAD_REQUEST, "Participant not found");
  }
};
