/* eslint-disable @typescript-eslint/no-explicit-any */
import HttpStatus from "http-status";
import mongoose, { Types } from "mongoose";
import { JwtPayload } from "../../interface/global";
import { UserModel } from "../User/user.model";
import { IParent } from "./parent.interface";
import AppError from "../../erros/AppError";
import { sendFileToCloudinary } from "../../utils/sendImageToCloudinary";
import { ParentModel } from "./parent.model";
import { SessionModel } from "../Session/session.model";
import QueryBuilder from "../../../builder/QueryBuilder";
import { ConversationModel } from "../Conversation/conversation.model";
import { ConversationType } from "../Conversation/conversation.interface";
import { ProfessionalModel } from "../Professional/professional.model";
import { INotification } from "../Notification/notification.interface";
import { createNotification } from "../Notification/notification.service";

const createParent = async (
  file: Express.Multer.File,
  user: JwtPayload,
  payload: IParent,
) => {
  const userId = new Types.ObjectId(user.user);
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Step 1: Check if the user exists
    const isUserExist = await UserModel.findById(userId).populate("roleId");
    if (!isUserExist) {
      throw new AppError(HttpStatus.NOT_FOUND, "The user is not found");
    }

    // Step 2: Check if the parent already exists
    const isParentExist = await ParentModel.findById(isUserExist.roleId);
    if (isParentExist) {
      throw new AppError(HttpStatus.BAD_REQUEST, "The parent already exists");
    }

    // Step 3: Check if the file is provided
    if (!file) {
      throw new AppError(HttpStatus.NOT_FOUND, "The file is not found");
    }

    // Step 4: Upload the file to Cloudinary
    const result = await sendFileToCloudinary(
      file.buffer,
      file.originalname,
      file.mimetype,
    );
    if (result) {
      payload.profileImage = result?.secure_url;
      payload.user = isUserExist._id;

      // Step 5: Create the parent in the database
      const createdParent = await ParentModel.create([payload], { session });

      if (createdParent) {
        const notInfo: INotification = {
          sender: new Types.ObjectId(createdParent[0]?.user),
          type: "user_join",
          message: `A Parent joined the app: (${createdParent[0]?.name})`,
        };
        await createNotification(notInfo);
      }

      // Step 6: Update the user with the parent role
      await UserModel.findByIdAndUpdate(
        isUserExist._id,
        { roleId: createdParent[0]._id, roleRef: "Parent", isActive: true },
        { new: true, session },
      );

      // Step 7: Find the Admin user (assuming roleRef identifies admins)
      const adminUser = await UserModel.findOne({ roleRef: "Admin" });
      if (!adminUser) {
        throw new AppError(HttpStatus.NOT_FOUND, "Admin user not found");
      }

      // Step 8: Create an individual conversation between Admin and Parent
      const individualConversation = new ConversationModel({
        type: ConversationType.INDIVIDUAL,
        users: [adminUser._id, createdParent[0].user],
        isDeleted: false,
      });

      const savedIndividualConversation = await individualConversation.save({
        session,
      });

      // Step 9: Check if the group conversation exists (Admin and all Parents)
      let groupConversation = await ConversationModel.findOne({
        type: ConversationType.GROUP,
        conversationName: "Parents Group", // The group name
        users: { $in: [adminUser._id] }, // Admin should already be part of the group
      });

      if (!groupConversation) {
        // Step 10: If no existing group conversation, create a new one with the Admin and the first parent
        groupConversation = new ConversationModel({
          type: ConversationType.GROUP,
          conversationName: "Parents Group", // Group name for all parents
          users: [adminUser._id, createdParent[0].user], // Add Admin and the new Parent
          isDeleted: false,
        });
        await groupConversation.save({ session });
      } else {
        // Step 11: If the group conversation exists, add the new parent to the group
        if (createdParent[0].user) {
          // Ensure the user exists
          if (!groupConversation.users.includes(createdParent[0].user)) {
            groupConversation.users.push(createdParent[0].user);
            await groupConversation.save({ session });
          }
        } else {
          throw new AppError(
            HttpStatus.BAD_REQUEST,
            "User ID for the created parent is not valid",
          );
        }
      }

      // Commit the transaction after all steps
      await session.commitTransaction();

      return {
        createdParent: createdParent[0],
        individualConversation: savedIndividualConversation,
        groupConversation: groupConversation,
      };
    }

    throw new AppError(HttpStatus.BAD_REQUEST, "File upload failed");
  } catch (error) {
    // Abort the transaction if an error occurs
    await session.abortTransaction();
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      error ? (error as any) : "An error occurred",
    );
  } finally {
    // End the session
    await session.endSession();
  }
};

const verifySessionByCode = async (
  user: JwtPayload,
  payload: { code: string },
) => {
  const userId = new Types.ObjectId(user.user);

  // Step 1: Check if the Parent exists
  const isParentExist = await ParentModel.findOne({ user: userId });
  if (!isParentExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Parent not found");
  }

  // Step 2: Check if the session exists with the provided code for the parent
  const isSessionExist = await SessionModel.findOne({
    code: payload.code,
    parent: isParentExist._id,
  });
  if (!isSessionExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Session not found");
  }

  // Step 3: Check if the Professional linked to the session exists
  const isProfessionalExist = await ProfessionalModel.findById(
    isSessionExist.professional,
  );
  if (!isProfessionalExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Professional not found");
  }

  // Step 4: Validate the session code
  if (payload.code && payload.code !== isSessionExist.code) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Code is invalid");
  }

  // Step 5: Update the session to mark it as verified
  const verifySession = await SessionModel.findByIdAndUpdate(
    isSessionExist._id,
    {
      isSessionVerified: true,
    },
    {
      new: true,
    },
  );

  // // Step 6: Create an individual conversation between the Parent and the Professional
  // const individualConversation = new ConversationModel({
  //   type: ConversationType.INDIVIDUAL,
  //   users: [isParentExist.user, isProfessionalExist.user], // Parent and Professional as users
  //   isDeleted: false,
  // });

  // // Save the conversation
  // const savedConversation = await individualConversation.save();

  // Return the updated session and conversation details
  return verifySession;
};

const getEachParent = async (id: string) => {
  const isSessionExist = await ParentModel.findById(id).populate({
    path: "user",
    select: "email",
  });
  if (!isSessionExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Parent not found");
  }
  return isSessionExist;
};

const getAssignedProfiles = async (user: JwtPayload) => {
  const userId = new Types.ObjectId(user.user);
  const isUserExist = await UserModel.findById(userId);

  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }

  let filter = {};
  let populateConfig: any = {};

  // 👉 Check role
  if (isUserExist.role === "parent") {
    // Parent → get assigned professionals
    filter = { parent: isUserExist.roleId, isDeleted: false };
    populateConfig = {
      path: "professional",
      select: "-availability",
      populate: { path: "user", select: "email role" },
    };
  } else if (isUserExist.role === "professional") {
    // Professional → get assigned parents
    filter = { professional: isUserExist.roleId, isDeleted: false };
    populateConfig = {
      path: "parent",
      populate: { path: "user", select: "email role" },
    };
  } else {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Invalid role. Only parent or professional allowed",
    );
  }

  // 👉 Query
  const session = await SessionModel.find(filter)
    .select("-day -date -time -subject -status -code -isSessionVerified")
    .populate(populateConfig);

  if (!session) {
    throw new AppError(HttpStatus.NOT_FOUND, "Session not found");
  }

  return session;
};

const getUpcomingProfessionalSessions = async (
  user: JwtPayload,
  query: Record<string, unknown>,
) => {
  const userId = new Types.ObjectId(user.user);
  const isUserExist = await UserModel.findById(userId);
  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }
  const session = new QueryBuilder(
    SessionModel.find({
      parent: isUserExist.roleId,
      isDeleted: false,
      status: "Upcoming",
    }).populate({
      path: "professional",
      populate: {
        path: "user",
        select: "email",
      },
    }),
    query,
  ).filter();
  if (!session) {
    throw new AppError(HttpStatus.NOT_FOUND, "session not found");
  }
  const meta = await session.countTotal();
  const result = await session.modelQuery;
  return { meta, result };
};

export const parentServices = {
  createParent,
  verifySessionByCode,
  getEachParent,
  getAssignedProfiles,
  getUpcomingProfessionalSessions,
};
