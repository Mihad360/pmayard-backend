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

const createProfessional = async (
  file: Express.Multer.File,
  user: JwtPayload,
  payload: IProfessional,
) => {
  const userId = new Types.ObjectId(user.user);
  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    const isUserExist = await UserModel.findById(userId).populate("roleId");

    if (!isUserExist) {
      throw new AppError(HttpStatus.NOT_FOUND, "The user is not found");
    }
    const isParentExist = await ProfessionalModel.findById(isUserExist.roleId);
    if (isParentExist) {
      throw new AppError(HttpStatus.BAD_REQUEST, "The parent is already exist");
    }
    if (!file) {
      throw new AppError(HttpStatus.NOT_FOUND, "The file is not found");
    }

    const result = await sendFileToCloudinary(
      file.buffer,
      file.originalname,
      file.mimetype,
    );
    if (result) {
      payload.profileImage = result?.secure_url;
      payload.user = isUserExist._id;
      const createPro = await ProfessionalModel.create([payload], { session });

      await UserModel.findByIdAndUpdate(
        isUserExist._id,
        {
          roleId: createPro[0]._id,
          roleRef: "Professional",
        },
        { new: true, session },
      );

      await session.commitTransaction();
      return createPro[0];
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
      status: "Upcoming",
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
