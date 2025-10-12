/* eslint-disable @typescript-eslint/no-explicit-any */
import HttpStatus from "http-status";
import AppError from "../../erros/AppError";
import { IMessage } from "./message.interface";
import { Message } from "./message.model";
import mongoose, { Types } from "mongoose";
import { ConversationModel } from "../Conversation/conversation.model";
import { JwtPayload } from "../../interface/global";
import { UserModel } from "../User/user.model";
import { IUser, IUserWithPopulatedRole } from "../User/user.interface";

const sendMessageText = async (
  conversationId: string,
  user: string,
  payload: IMessage,
) => {
  const userId = new Types.ObjectId(user); // Extract the user ID from the JWT token
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Check if the conversation exists for the provided conversation ID and userId
    const conversation = await ConversationModel.findOne({
      _id: conversationId,
      users: { $in: [userId] },
    }).session(session); // Ensure session is used

    if (!conversation) {
      throw new AppError(
        HttpStatus.NOT_FOUND,
        "Conversation not found or user not authorized.",
      );
    }

    // Set the sender_id in the payload
    payload.sender_id = userId;
    payload.conversation_id = new Types.ObjectId(conversationId);
    payload.message_type = "text";

    // Create the message with session for transaction
    const result = await Message.create([payload], { session });

    if (!result) {
      throw new AppError(HttpStatus.BAD_REQUEST, "Message failed to send");
    }

    // Update the conversation with the last message ID
    const updatedConversation = await ConversationModel.findByIdAndUpdate(
      conversationId,
      { lastMsg: result[0]._id },
      { new: true, session },
    );

    if (!updatedConversation) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "Something went wrong during conversation update",
      );
    }

    // Commit transaction after everything is done
    await session.commitTransaction();
    await session.endSession();

    return result[0]; // Return the first message from the result array
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    throw new AppError(HttpStatus.BAD_REQUEST, error as any);
  }
};

const getAllMessage = async (conversationId: string, user: JwtPayload) => {
  const isUserExist = await UserModel.findById(user.user);
  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }

  // Ensure the route works only for Professional or Parent roles
  if (
    isUserExist.roleRef !== "Professional" &&
    isUserExist.roleRef !== "Parent"
  ) {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      "Access denied for non-Professional/Parent users",
    );
  }

  let modelToPopulate: string;

  // Set the model to populate based on roleRef
  if (isUserExist.roleRef === "Professional") {
    modelToPopulate = "Professional";
  } else if (isUserExist.roleRef === "Parent") {
    modelToPopulate = "Parent";
  } else {
    modelToPopulate = "User"; // This case won't hit due to the earlier check
  }

  // Retrieve conversation and populate role information
  const conversation = await ConversationModel.findOne({
    _id: new Types.ObjectId(conversationId),
    users: { $in: [user.user] }, // Ensure the user is part of the conversation
  }).populate({
    path: "users", // Populate the users field to include user details
    select: "email roleId role", // Only select the necessary fields
    populate: {
      path: "roleId", // Populating roleId (Professional/Parent)
      select: "name profileImage", // Only select name and profileImage from roleId
      model: modelToPopulate,
    },
  });

  if (!conversation) {
    throw new AppError(HttpStatus.NOT_FOUND, "The conversation not found");
  }

  // Filter out Admin users from the conversation
  const filteredUsers = conversation.users.filter(
    (user: Partial<IUser>) => user.role !== "admin",
  );

  let messages;

  // For individual conversations, both users can send messages
  if (conversation.type === "individual") {
    // Fetch all messages where the sender is part of the conversation's users
    messages = await Message.find({
      conversation_id: conversation._id,
      sender_id: {
        $in: filteredUsers.map((user: Partial<IUser>) => user._id),
      },
    });

    console.log("Messages fetched: ", messages); // Log the messages

    // Format messages based on the role of the user
    messages = messages.map((message) => {
      // Find the sender in the users array
      const sender = filteredUsers.find(
        (user) => user._id.toString() === message.sender_id.toString(),
      ) as Partial<IUserWithPopulatedRole>;

      return {
        ...message.toObject(),
        senderRole: sender?.role, // Adding the role information for frontend
        senderProfileImage: sender?.roleId?.profileImage || "",
        senderName: sender?.roleId?.name, // Adding sender name
      };
    });
  } else if (conversation.type === "group") {
    // For group conversations, filter out Admin and only show messages from Professional/Parent
    messages = await Message.find({
      conversation_id: conversation._id,
      sender_id: {
        $in: filteredUsers.map((user: Partial<IUser>) => user._id),
      },
    });

    console.log("Messages fetched: ", messages); // Log the messages

    // Format messages with admin distinction
    messages = messages.map((message) => {
      // Find the sender in the users array
      const sender = filteredUsers.find(
        (user) => user._id.toString() === message.sender_id.toString(),
      ) as Partial<IUserWithPopulatedRole>;

      return {
        ...message.toObject(),
        senderRole: sender?.role, // Adding the role information for frontend
        senderProfileImage: sender?.roleId?.profileImage || "",
        senderName: sender?.roleId?.name, // Adding sender name
      };
    });
  }

  if (!messages || messages.length === 0) {
    throw new AppError(HttpStatus.NOT_FOUND, "The messages not found");
  }

  // Now return the conversation and the formatted messages
  return {
    success: true,
    message: "Data retrieved successfully",
    data: {
      conversation: {
        _id: conversation._id,
        type: conversation.type,
        users: filteredUsers.map((user: Partial<IUserWithPopulatedRole>) => ({
          _id: user._id,
          email: user.email,
          role: user.role,
          roleId: user.roleId, // Include role details
          profileImage: user.roleId?.profileImage || "", // Include profile image if roleId exists
        })),
      },
      messages, // Messages now have senderRole, senderProfileImage, and senderName for the frontend
    },
  };
};

export const messageServices = {
  sendMessageText,
  getAllMessage,
};
