/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prefer-const */
import HttpStatus from "http-status";
import { Types } from "mongoose";
import { JwtPayload } from "../../interface/global";
import { ConversationModel } from "./conversation.model";
import AppError from "../../erros/AppError";
import { UserModel } from "../User/user.model";

const getMyConversations = async (
  user: JwtPayload,
  filterParams: { type?: string },
) => {
  try {
    const userId = new Types.ObjectId(user.user);

    // build filter
    let filterQuery: any = { users: { $in: [userId] } };

    if (filterParams?.type) {
      filterQuery.type = filterParams.type;
    }

    // find conversations + populate lastMsg
    let conversations = await ConversationModel.find(filterQuery)
      .populate({
        path: "lastMsg",
        select: "message_text sender_id is_read message_type createdAt",
      })
      .lean(); // improves performance

    if (!conversations || conversations.length === 0) {
      throw new AppError(HttpStatus.NOT_FOUND, "Conversations not available");
    }

    // loop through each conversation
    for (let conversation of conversations) {
      if (conversation.type === "individual") {
        const otherUser = await UserModel.findOne({
          $and: [
            { _id: { $ne: userId } },
            { _id: { $in: conversation.users } },
          ],
        });

        if (!otherUser) {
          throw new AppError(HttpStatus.NOT_FOUND, "Other user not found");
        }

        // populate ONLY the other user
        const populated = await ConversationModel.findById(conversation._id)
          .populate({
            path: "users",
            match: { _id: otherUser._id },
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
          })
          .populate({
            path: "lastMsg",
            select: "message_text sender_id is_read message_type createdAt",
          })
          .lean();

        // Replace with fully populated conversation
        Object.assign(conversation, populated);
      }
    }

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
