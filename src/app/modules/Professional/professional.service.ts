/* eslint-disable @typescript-eslint/no-explicit-any */
import HttpStatus from "http-status";
import mongoose, { Types } from "mongoose";
import { JwtPayload } from "../../interface/global";
import { IProfessional } from "./professional.interface";
import { UserModel } from "../User/user.model";
import AppError from "../../erros/AppError";
import { ProfessionalModel } from "./professional.model";
import { sendFileToCloudinary } from "../../utils/sendImageToCloudinary";
import { ISession } from "../Session/session.interface";
import { SessionModel } from "../Session/session.model";
import dayjs from "dayjs";
import QueryBuilder from "../../../builder/QueryBuilder";
import { ConversationModel } from "../Conversation/conversation.model";
import { ConversationType } from "../Conversation/conversation.interface";

const createProfessional = async (
  file: Express.Multer.File,
  user: JwtPayload,
  payload: IProfessional,
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

    // Step 2: Check if the professional already exists
    const isProfessionalExist = await ProfessionalModel.findById(
      isUserExist.roleId,
    );
    if (isProfessionalExist) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "The professional already exists",
      );
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

      // Step 5: Create the professional in the database
      const createdProfessional = await ProfessionalModel.create([payload], {
        session,
      });

      // Step 6: Update the user with the professional role
      await UserModel.findByIdAndUpdate(
        isUserExist._id,
        { roleId: createdProfessional[0]._id, roleRef: "Professional" },
        { new: true, session },
      );

      // Step 7: Find the Admin user (assuming roleRef identifies admins)
      const adminUser = await UserModel.findOne({ roleRef: "Admin" });
      if (!adminUser) {
        throw new AppError(HttpStatus.NOT_FOUND, "Admin user not found");
      }

      // Step 8: Create an individual conversation between Admin and Professional
      const individualConversation = new ConversationModel({
        type: ConversationType.INDIVIDUAL,
        users: [adminUser._id, createdProfessional[0].user],
        isDeleted: false,
      });

      const savedIndividualConversation = await individualConversation.save({
        session,
      });

      // Step 9: Check if the group conversation exists
      let groupConversation = await ConversationModel.findOne({
        type: ConversationType.GROUP,
        conversationName: "Professionals Group",
        users: { $in: [adminUser._id] }, // Admin should already be part of the group
      });

      if (!groupConversation) {
        // Step 10: If no existing group conversation, create a new one with the Admin and the first professional
        groupConversation = new ConversationModel({
          type: ConversationType.GROUP,
          conversationName: "Professionals Group",
          users: [adminUser._id, createdProfessional[0].user], // Add Admin and the new Professional
          isDeleted: false,
        });
        await groupConversation.save({ session });
      } else {
        // Step 11: If the group conversation exists, add the new professional to the group
        if (createdProfessional[0].user) {
          // Ensure the user exists
          if (!groupConversation.users.includes(createdProfessional[0].user)) {
            groupConversation.users.push(createdProfessional[0].user);
            await groupConversation.save({ session });
          }
        } else {
          throw new AppError(
            HttpStatus.BAD_REQUEST,
            "User ID for the created professional is not valid",
          );
        }
      }

      // Commit the transaction after all steps
      await session.commitTransaction();

      // Return the created professional and conversation details
      return {
        createdProfessional: createdProfessional[0],
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

const confirmSession = async (id: string, payload: ISession) => {
  const isSessionExist = await SessionModel.findById(id);
  if (!isSessionExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Session not found");
  }
  const isProfessionalExist = await ProfessionalModel.findById(
    isSessionExist.professional,
  );
  if (!isProfessionalExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "professional not found");
  }
  const day = dayjs(payload.date).format("dddd");
  const confirmSession = await SessionModel.findByIdAndUpdate(
    isSessionExist._id,
    {
      date: payload.date,
      time: payload.time,
      day: day,
      status: "Confirmed",
    },
    { new: true },
  );

  if (confirmSession) {
    const professional = isProfessionalExist;

    const availabilityForDay = professional.availability.find(
      (avail) => avail.day === day,
    );

    const timeslotToUpdate = availabilityForDay?.timeSlots.find(
      (slot) =>
        slot.startTime === payload?.time?.startTime &&
        slot.endTime === payload?.time?.endTime &&
        slot.status === "available",
    );
    if (timeslotToUpdate) {
      timeslotToUpdate.status = "booked";
      await professional.save();
      return confirmSession;
    }
  } else {
    throw new AppError(HttpStatus.BAD_REQUEST, "Something went wrong");
  }
};

const getAssignedParents = async (user: JwtPayload) => {
  const userId = new Types.ObjectId(user.user);
  const isUserExist = await UserModel.findById(userId);
  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }
  const session = await SessionModel.find({
    professional: isUserExist.roleId,
    isDeleted: false,
    // status: "Upcoming",
  })
    .select("-day -date -time -subject -status -code -isSessionVerified")
    .populate({
      path: "parent",
      populate: {
        path: "user",
        select: "email",
      },
    });
  if (!session) {
    throw new AppError(HttpStatus.NOT_FOUND, "session not found");
  }
  return session;
};

const getEachProfessional = async (id: string) => {
  const isSessionExist = await ProfessionalModel.findById(id).populate({
    path: "user",
    select: "email",
  });
  if (!isSessionExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Parent not found");
  }
  return isSessionExist;
};

const getUpcomingParentSessions = async (
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
      professional: isUserExist.roleId,
      isDeleted: false,
      status: { $in: ["Upcoming", "Confirmed"] },
    }).populate({
      path: "parent",
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

export const professionalServices = {
  createProfessional,
  confirmSession,
  getAssignedParents,
  getEachProfessional,
  getUpcomingParentSessions,
};
