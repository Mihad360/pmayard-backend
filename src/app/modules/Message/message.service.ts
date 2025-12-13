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
import { emitMessageData } from "../../utils/socket";
import { IConversationWithUsers } from "../Conversation/conversation.interface";

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
    const conversation: IConversationWithUsers | any =
      await ConversationModel.findOne({
        _id: conversationId,
        users: { $in: [userId] },
      })
        .populate({ path: "users", select: "email role" })
        .session(session);

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

    emitMessageData({
      conversationId,
      senderId: userId.toString(),
      messageContent: result[0].message_text,
      messageType: result[0].message_type,
    });
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

const getMessages = async (conversationId: string, user: JwtPayload) => {
  // Start a Mongoose session for the transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Ensure the user exists
    const isUserExist = await UserModel.findById(user.user).session(session);
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

    // Retrieve the conversation first to determine its type
    const conversation = await ConversationModel.findOne({
      _id: new Types.ObjectId(conversationId),
      users: { $in: [user.user] }, // Ensure the user is part of the conversation
    }).session(session);

    if (!conversation) {
      throw new AppError(HttpStatus.NOT_FOUND, "Conversation not found");
    }

    if (conversation.lastMsg) {
      const updateIsRead = await Message.findByIdAndUpdate(
        conversation.lastMsg,
        {
          is_read: true,
        },
        { new: true },
      );
      if (!updateIsRead) {
        throw new AppError(HttpStatus.BAD_REQUEST, "Message update failed");
      }
    }

    let result;

    if (conversation.type === "individual") {
      // If it's an individual conversation, call the logic for individual
      let modelToPopulate: string;
      if (isUserExist.roleRef === "Professional") {
        modelToPopulate = "Professional";
      } else if (isUserExist.roleRef === "Parent") {
        modelToPopulate = "Parent";
      } else {
        modelToPopulate = "User";
      }

      // Populate the conversation and last message
      const populatedConversation = await ConversationModel.findOne({
        _id: new Types.ObjectId(conversationId),
        type: "individual",
        users: { $in: [user.user] },
      })
        .populate({
          path: "users",
          select: "email roleId role",
          populate: {
            path: "roleId",
            select: "name profileImage",
            model: modelToPopulate,
          },
        })
        .populate({
          path: "lastMsg",
          select: "message_text message_type sender_id",
        })
        .session(session);

      if (!populatedConversation || populatedConversation.users.length !== 2) {
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          "Invalid individual conversation",
        );
      }

      const oppositeUserId = await UserModel.findOne({
        $and: [
          { _id: { $ne: isUserExist._id } }, // Exclude the logged-in user
          { _id: { $in: conversation.users.map((user: IUser) => user._id) } }, // Ensure the user is part of the conversation
        ],
      }).session(session);

      if (!oppositeUserId) {
        throw new AppError(HttpStatus.NOT_FOUND, "Opposite user not found");
      }

      const oppositeUser = (await UserModel.findOne({
        $and: [
          { _id: { $ne: isUserExist._id } }, // Exclude the logged-in user
          { _id: { $in: conversation.users.map((user: IUser) => user._id) } }, // Ensure the user is part of the conversation
        ],
      })
        .populate({
          path: "roleId",
          select: "name profileImage",
          model:
            oppositeUserId.roleRef === "Professional"
              ? "Professional"
              : oppositeUserId.roleRef === "Parent"
                ? "Parent"
                : "User",
        })
        .session(session)) as Partial<IUserWithPopulatedRole>;

      if (!oppositeUser) {
        throw new AppError(HttpStatus.NOT_FOUND, "Opposite user not found");
      }

      // Retrieve all messages for the conversation
      const messages = await Message.find({
        conversation_id: populatedConversation._id,
      })
        .sort({ createdAt: -1 })
        .populate({
          path: "sender_id",
          select: "email roleId role",
          populate: {
            path: "roleId",
            select: "name profileImage",
            model:
              oppositeUser.roleRef === "Professional"
                ? "Professional"
                : oppositeUser.roleRef === "Parent"
                  ? "Parent"
                  : "User",
          },
        })
        .populate({ path: "attachment_id", select: "fileUrl mimeType" })
        .session(session);

      result = {
        oppositeUser: {
          userId: oppositeUser._id,
          email: oppositeUser.email,
          role: oppositeUser.role,
          userName: oppositeUser?.roleId?.name,
          userImage: oppositeUser.roleId?.profileImage,
        },
        messages: messages,
      };
    } else if (conversation.type === "group") {
      // If it's a group conversation, call the group logic
      let modelToPopulate: string;
      if (isUserExist.roleRef === "Professional") {
        modelToPopulate = "Professional";
      } else if (isUserExist.roleRef === "Parent") {
        modelToPopulate = "Parent";
      } else {
        modelToPopulate = "User";
      }

      const populatedGroupConversation = await ConversationModel.findOne({
        _id: new Types.ObjectId(conversationId),
        type: "group",
        users: { $in: [user.user] },
      })
        .populate({
          path: "users",
          select: "email roleId role",
          populate: {
            path: "roleId",
            select: "name profileImage",
            model: modelToPopulate,
          },
        })
        .populate({ path: "lastMsg", select: "message_text message_type" })
        .session(session);

      if (!populatedGroupConversation) {
        throw new AppError(
          HttpStatus.NOT_FOUND,
          "Group conversation not found",
        );
      }

      const messages = await Message.find({
        conversation_id: populatedGroupConversation._id,
      })
        .sort({ createdAt: -1 })
        .populate({ path: "sender_id", select: "email roleId role" })
        .populate({ path: "attachment_id", select: "fileUrl mimeType" })
        .session(session);

      // Format the messages
      const formattedMessages = messages.map((message: any) => {
        const sender = populatedGroupConversation.users.find(
          (user: IUser) =>
            user._id?.toString() === message.sender_id.toString(),
        ) as Partial<IUserWithPopulatedRole>;

        return {
          ...message.toObject(),
          senderRole: sender?.role,
          senderProfileImage: sender?.roleId?.profileImage || null,
          senderName: sender?.roleId?.name,
          message_type: message.message_type,
          attachment: message.attachment_id
            ? {
                fileUrl: message.attachment_id.fileUrl,
                mimeType: message.attachment_id.mimeType,
              }
            : null,
        } as any;
      });

      result = {
        conversationId: populatedGroupConversation._id,
        groupName: populatedGroupConversation.conversationName,
        messages: formattedMessages,
      };
    }

    // Commit the transaction
    await session.commitTransaction();
    return { data: result };
  } catch (error) {
    // If there's any error, abort the transaction
    await session.abortTransaction();
    throw error;
  } finally {
    // End the session
    session.endSession();
  }
};

export const messageServices = {
  sendMessageText,
  getMessages,
};
