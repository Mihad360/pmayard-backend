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
import { ChatModel } from "../Chat/chat.model";
import { GroupMembership } from "../GroupMember/members.model";
import { GroupModel } from "../ChatParticipant/group.model";

const createProfessional = async (
  file: Express.Multer.File,
  user: JwtPayload,
  payload: IProfessional,
) => {
  const userId = new Types.ObjectId(user.user);
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Check if the user exists
    const isUserExist = await UserModel.findById(userId).populate("roleId");
    if (!isUserExist) {
      throw new AppError(HttpStatus.NOT_FOUND, "The user is not found");
    }

    // Check if the professional already exists
    const isProfessionalExist = await ProfessionalModel.findById(
      isUserExist.roleId,
    );
    if (isProfessionalExist) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "The professional already exists",
      );
    }

    // Check if the file is provided
    if (!file) {
      throw new AppError(HttpStatus.NOT_FOUND, "The file is not found");
    }

    // Upload the file to Cloudinary
    const result = await sendFileToCloudinary(
      file.buffer,
      file.originalname,
      file.mimetype,
    );
    if (result) {
      payload.profileImage = result?.secure_url;
      payload.user = isUserExist._id;

      // Create the professional in the database
      const createdProfessional = await ProfessionalModel.create([payload], {
        session,
      });

      // Update the user with the professional role
      await UserModel.findByIdAndUpdate(
        isUserExist._id,
        { roleId: createdProfessional[0]._id, roleRef: "Professional" },
        { new: true, session },
      );

      // Step 1: Check if Admin Group exists
      let adminGroup = await GroupModel.findOne({ group_name: "Admin Group" });

      if (!adminGroup) {
        // Step 2: Create Admin Group if it doesn't exist
        adminGroup = new GroupModel({
          group_name: "Admin Group",
          is_announcement_group: false, // Not an announcement-only group
        });
        await adminGroup.save({ session });
      }

      // Step 3: Add the Professional to the Admin Group
      await GroupMembership.create(
        [
          {
            user_id: createdProfessional[0].user, // Add the professional to the group
            group_id: adminGroup._id,
            role: "Member",
          },
        ],
        { session },
      );

      // Step 4: Find Admin User (programmatically)
      const adminUser = await UserModel.findOne({ role: "admin" }); // Assuming roleRef identifies admins
      if (!adminUser) {
        throw new AppError(HttpStatus.NOT_FOUND, "Admin user not found");
      }

      // Step 5: Create an individual chat between the Admin and the Professional
      const chat = new ChatModel({
        chatType: "individual",
        users: [adminUser._id, createdProfessional[0].user], // Add both Admin and Professional as users
      });
      await chat.save({ session });

      // Commit the transaction after all steps
      await session.commitTransaction();

      return createdProfessional[0];
    }

    throw new AppError(HttpStatus.BAD_REQUEST, "File upload failed");
  } catch (error) {
    await session.abortTransaction();
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      error ? (error as any) : "An error occurred",
    );
  } finally {
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
