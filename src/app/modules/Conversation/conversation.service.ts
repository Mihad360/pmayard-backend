import HttpStatus from "http-status";
import { Types } from "mongoose";
import { JwtPayload } from "../../interface/global";
import { ConversationModel } from "./conversation.model";
import AppError from "../../erros/AppError";
import { UserModel } from "../User/user.model";

const getMyConversations = async (user: JwtPayload) => {
  try {
    const userId = new Types.ObjectId(user.user); // Convert user ID to ObjectId

    // Find all conversations where the user is part of the conversation
    const conversations = await ConversationModel.find({
      users: { $in: [userId] },
    });

    // Check if conversations are found
    if (!conversations || conversations.length === 0) {
      throw new AppError(HttpStatus.NOT_FOUND, "Conversations not available");
    }

    // Loop through conversations and conditionally populate data
    for (let conversation of conversations) {
      // For individual conversations, populate the other user
      if (conversation.type === "individual") {
        // Get the other user by excluding the current userId from the users array
        const otherUser = await UserModel.findOne({
          $and: [
            { _id: { $ne: userId } }, // Exclude the logged-in user
            { _id: { $in: conversation.users.map((user) => user._id) } },
          ],
        });

        if (!otherUser) {
          throw new AppError(HttpStatus.NOT_FOUND, "Other user not found");
        }

        conversation = await conversation.populate({
          path: "users",
          match: { _id: otherUser },
          select:
            "-password -passwordChangedAt -otp -expiresAt -isActive -createdAt -updatedAt -__v -isVerified -isDeleted",
          populate: {
            path: "roleId",
            select: "name profileImage",
            model:
              otherUser.roleRef === "Professional"
                ? "Professional"
                : otherUser.roleRef === "Parent"
                  ? "Parent"
                  : "User",
          },
        });
      }
    }

    // Return the list of conversations
    return conversations;
  } catch (error) {
    console.error("Error fetching conversations:", error);
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Something went wrong while fetching conversations",
    );
  }
};

const getEachConversation = async (
  conversationId: string,
  user: JwtPayload,
) => {
  const isConversationExist = await ConversationModel.findOne({
    _id: conversationId,
    users: { $in: [user.user] },
  });

  if (!isConversationExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Conversation does not exist");
  }

  return isConversationExist;
};

export const conversationServices = {
  getMyConversations,
  getEachConversation,
};
