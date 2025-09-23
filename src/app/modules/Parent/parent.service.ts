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

const createParent = async (
  file: Express.Multer.File,
  user: JwtPayload,
  payload: IParent,
) => {
  const userId = new Types.ObjectId(user.user);
  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    const isUserExist = await UserModel.findById(userId).populate("roleId");

    if (!isUserExist) {
      throw new AppError(HttpStatus.NOT_FOUND, "The user is not found");
    }
    const isParentExist = await ParentModel.findById(isUserExist.roleId);
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
      const createPar = await ParentModel.create([payload], { session });

      await UserModel.findByIdAndUpdate(
        isUserExist._id,
        {
          roleId: createPar[0]._id,
          roleRef: "Parent",
        },
        { new: true, session },
      );

      await session.commitTransaction();
      return createPar[0];
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

const verifySessionByCode = async (
  user: JwtPayload,
  payload: { code: string },
) => {
  const userId = new Types.ObjectId(user.user);
  const isParentExist = await ParentModel.findOne({ user: userId });
  if (!isParentExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Parent not found");
  }
  const isSessionExist = await SessionModel.findOne({
    code: payload.code,
    parent: isParentExist._id,
  });
  if (!isSessionExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Session not found");
  }
  if (payload.code && payload.code !== isSessionExist.code) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Code is invalid");
  }
  const verifySession = await SessionModel.findByIdAndUpdate(
    isSessionExist._id,
    {
      isSessionVerified: true,
    },
    {
      new: true,
    },
  );
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

const getAssignedProfessionals = async (user: JwtPayload) => {
  const userId = new Types.ObjectId(user.user);
  const isUserExist = await UserModel.findById(userId);
  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }
  const session = await SessionModel.find({
    parent: isUserExist.roleId,
    isDeleted: false,
    // status: "Upcoming",
  })
    .select("-day -date -time -subject -status -code -isSessionVerified")
    .populate({
      path: "professional",
    });
  if (!session) {
    throw new AppError(HttpStatus.NOT_FOUND, "session not found");
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
  getAssignedProfessionals,
  getUpcomingProfessionalSessions,
};
