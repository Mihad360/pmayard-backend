/* eslint-disable @typescript-eslint/no-explicit-any */
import HttpStatus from "http-status";
import AppError from "../../erros/AppError";
import { IMessage, IMessageWithPopulatedRole } from "./message.interface";
import { Message } from "./message.model";
import mongoose, { Types } from "mongoose";
import { ConversationModel } from "../Conversation/conversation.model";
import { JwtPayload } from "../../interface/global";
import { UserModel } from "../User/user.model";
import { IUserWithPopulatedRole } from "../User/user.interface";
import { IConversationExtendsWithLastMsg } from "../Conversation/conversation.interface";

const sendMessageText = async (
  conversationId: string,
  user: JwtPayload,
  payload: IMessage,
) => {
  const userId = new Types.ObjectId(user.user); // Extract the user ID from the JWT token
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

    if (conversation.type === "group" && user.role !== "admin") {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "Only admin can send messages to this conversation",
      );
    }

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

  let modelToPopulate: string;
  // Set the model to populate based on roleRef
  if (isUserExist.roleRef === "Professional") {
    modelToPopulate = "Professional";
  } else if (isUserExist.roleRef === "Parent") {
    modelToPopulate = "Parent";
  } else {
    modelToPopulate = "User"; // This case won't hit due to the earlier check
  }

  // Retrieve conversation and populate role information for all users in the conversation
  const conversation = (await ConversationModel.findOne({
    _id: new Types.ObjectId(conversationId),
    type: "individual", // Ensure it's an individual conversation
    users: { $in: [user.user] }, // Ensure the user is part of the conversation
  })
    .populate({
      path: "users", // Populate the users field to include user details
      select: "email roleId role", // Only select the necessary fields
      populate: {
        path: "roleId", // Populating roleId (Professional/Parent)
        select: "name profileImage", // Select only name and profileImage from roleId
        model: modelToPopulate, // Ensure roleId is populated based on role
      },
    })
    .populate({
      path: "lastMsg",
      select: "message_text message_type sender_id",
    })) as Partial<IConversationExtendsWithLastMsg>;

  if (!conversation) {
    throw new AppError(HttpStatus.NOT_FOUND, "The conversation not found");
  }

  // Ensure there are only two users in an individual conversation
  if (conversation?.users?.length !== 2) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Invalid individual conversation",
    );
  }

  // Find the opposite user (the one who is not the logged-in user)
  const oppositeUser = (await UserModel.findOne({
    $and: [
      { _id: { $ne: isUserExist._id } }, // Exclude the logged-in user
      { _id: { $in: conversation.users.map((user) => user._id) } }, // Ensure the user is part of the conversation
    ],
  }).populate({
    path: "roleId",
    select: "name profileImage",
    model: modelToPopulate,
  })) as Partial<IUserWithPopulatedRole>;
  
  if (!oppositeUser) {
    throw new AppError(HttpStatus.NOT_FOUND, "Opposite user not found");
  }

  const senderId = conversation?.lastMsg?.sender_id;
  const msgSender = await UserModel.findById(senderId);
  if (!msgSender) {
    throw new AppError(HttpStatus.NOT_FOUND, "Message sender not found");
  }

  const userRole =
    msgSender.roleRef === "Professional"
      ? "Professional"
      : msgSender.roleRef === "Parent"
        ? "Parent"
        : "User";

  // Retrieve all messages from the conversation
  const messages = (await Message.find({
    conversation_id: conversation._id,
  }).populate({
    path: "sender_id", // Populate the sender_id directly
    select: "email roleId role", // Only select the necessary fields
    populate: {
      path: "roleId", // Populate roleId (Professional/Parent)
      select: "name profileImage", // Select only name and profileImage from roleId
      model: userRole,
    },
  })) as Partial<IMessageWithPopulatedRole>;

  return {
    data: {
      oppositeUser: {
        userId: oppositeUser._id,
        email: oppositeUser.email,
        role: oppositeUser.role,
        userName: oppositeUser?.roleId?.name, // This should be populated now
        userImage: oppositeUser.roleId?.profileImage, // This should be populated now
      },
      messages: messages, // Return the formatted messages with sender details
    },
  };
};

const getGroupMessagesForEveryone = async (
  conversationId: string,
  user: JwtPayload,
) => {
  // Ensure the user exists
  const isUserExist = await UserModel.findById(user.user);
  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }

  // Ensure the user is either Admin, Professional, or Parent
  if (
    isUserExist.roleRef !== "Admin" &&
    isUserExist.roleRef !== "Professional" &&
    isUserExist.roleRef !== "Parent"
  ) {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      "Access denied for non-admin/professional/parent users",
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

  // Fetch the conversation based on the provided conversationId
  const conversation = await ConversationModel.findOne({
    _id: new Types.ObjectId(conversationId),
    type: "group", // Ensure it's a group conversation
    users: { $in: [user.user] }, // Ensure the user is part of the conversation
  })
    .populate({
      path: "users", // Populate the users field to include user details
      select: "email roleId role", // Select necessary fields
      populate: {
        path: "roleId", // Populate roleId (Professional/Parent)
        select: "name profileImage", // Select only name and profileImage from roleId
        model: modelToPopulate, // Ensure roleId is populated for Admins
      },
    })
    .populate({ path: "lastMsg", select: "message_text message_type" });

  if (!conversation) {
    throw new AppError(HttpStatus.NOT_FOUND, "Group conversation not found");
  }

  // Fetch all messages for this specific conversation
  const messages = await Message.find({ conversation_id: conversation._id });

  // Map through the messages and add sender info
  const formattedMessages = messages.map((message) => {
    const sender = conversation.users.find(
      (user) => user._id.toString() === message.sender_id.toString(),
    ) as Partial<IUserWithPopulatedRole>;

    return {
      ...message.toObject(),
      senderRole: sender?.role, // Add sender role info
      senderProfileImage: sender?.roleId?.profileImage,
      senderName: sender?.roleId?.name, // Add sender name
    } as any;
  });

  return {
    success: true,
    message: "Group conversation and messages retrieved successfully",
    data: {
      conversationId: conversation._id,
      groupName: conversation.conversationName,
      messages: formattedMessages,
    },
  };
};

export const messageServices = {
  sendMessageText,
  getAllMessage,
  getGroupMessagesForEveryone,
};
