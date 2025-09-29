import HttpStatus from "http-status";
import { Types } from "mongoose";
import { JwtPayload } from "../../interface/global";
import { UserModel } from "../User/user.model";
import AppError from "../../erros/AppError";
import { ParentModel } from "../Parent/parent.model";
import QueryBuilder from "../../../builder/QueryBuilder";
import {
  parentSearch,
  professionalSearch,
  sendAssignmentEmail,
  sessionSearch,
} from "./admin.utils";
import { ProfessionalModel } from "../Professional/professional.model";
import { ISession } from "../Session/session.interface";
import { SessionModel } from "../Session/session.model";

const getAllParents = async (
  user: JwtPayload,
  query: Record<string, unknown>,
) => {
  const userId = new Types.ObjectId(user.user);
  const isUserExist = await UserModel.findById(userId);
  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "The user is not exist");
  }
  const parentsQuery = new QueryBuilder(
    ParentModel.find({ isDeleted: false }),
    query,
  )
    .search(parentSearch)
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await parentsQuery.countTotal();
  const result = await parentsQuery.modelQuery;
  return { meta, result };
};

const getAllProfessionals = async (
  user: JwtPayload,
  query: Record<string, unknown>,
) => {
  const userId = new Types.ObjectId(user.user);
  const isUserExist = await UserModel.findById(userId);
  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "The user is not exist");
  }
  const sessions = await SessionModel.countDocuments({
    professional: isUserExist.roleId,
    status: "Completed",
  });
  console.log(sessions);
  const professionalsQuery = new QueryBuilder(
    ProfessionalModel.find({ isDeleted: false }).populate({
      path: "user",
      select: "-password",
    }),
    query,
  )
    .search(professionalSearch)
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await professionalsQuery.countTotal();
  const result = await professionalsQuery.modelQuery;
  return { meta, sessions, result };
};

const getAllSessions = async (
  user: JwtPayload,
  query: Record<string, unknown>,
) => {
  const userId = new Types.ObjectId(user.user);
  const isUserExist = await UserModel.findById(userId);
  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "The user is not exist");
  }
  const professionalsQuery = new QueryBuilder(
    SessionModel.find({ isDeleted: false }).populate("parent professional"),
    query,
  )
    .search(sessionSearch)
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await professionalsQuery.countTotal();
  const result = await professionalsQuery.modelQuery;
  return { meta, result };
};

const getEachParent = async (id: string) => {
  const isParentExist = await ParentModel.findById(id).populate({
    path: "user",
    select: "-password -otp",
  });
  if (!isParentExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Parent not found");
  }
  return isParentExist;
};

const assignProfessional = async (parentId: string, payload: ISession) => {
  const isParentExist = await ParentModel.findById(parentId);
  if (!isParentExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Parent not found");
  }
  const isProfessionalExist = await ProfessionalModel.findById(
    payload.professional,
  );
  if (!isProfessionalExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Professional not found");
  }
  const availability = isProfessionalExist?.availability;

  const isAvailable = availability.some((avail) =>
    avail.timeSlots.find((slot) => slot.status === "available"),
  );
  if (!isAvailable) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "No available time slots for this professional",
    );
  }

  payload.parent = isParentExist._id;
  payload.professional = isProfessionalExist._id;
  payload.status = "Upcoming";
  //   const day = dayjs(payload.date).format("dddd");
  //   payload.day = day;

  const result = await SessionModel.create(payload);
  return result;
};

const setCodeForSession = async (
  sessionId: string,
  payload: { code: string },
) => {
  const isSessionExist = await SessionModel.findById(sessionId);
  if (!isSessionExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Session not found");
  }
  const isParentExist = await ParentModel.findById(isSessionExist.parent);
  if (!isParentExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Parent not found");
  }
  const isUserExist = await UserModel.findById(isParentExist?.user);
  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }
  const isProfessionalExist = await ProfessionalModel.findById(
    isSessionExist.professional,
  );
  if (!isProfessionalExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "professional not found");
  }
  const isCodeMatch = await SessionModel.findOne({
    $and: [{ code: payload.code, status: "Upcoming" }],
  });
  if (isCodeMatch) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Please enter a new code");
  }
  const result = await SessionModel.findByIdAndUpdate(
    isSessionExist._id,
    {
      code: payload.code,
    },
    {
      new: true,
    },
  );

  if (result) {
    await sendAssignmentEmail(result.professional, result.parent, result.code);
  }
  return result;
};

const assignProfessionalAndSetCode = async (
  parentId: string,
  professionalId: string,
  payload: ISession,
) => {
  const isParentExist = await ParentModel.findById(parentId);
  if (!isParentExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Parent not found");
  }

  const isProfessionalExist = await ProfessionalModel.findById(professionalId);
  if (!isProfessionalExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Professional not found");
  }

  const availability = isProfessionalExist?.availability;
  const isAvailable = availability.some((avail) =>
    avail.timeSlots.find((slot) => slot.status === "available"),
  );

  if (!isAvailable) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "No available time slots for this professional",
    );
  }
  const isCodeMatch = await SessionModel.findOne({
    $and: [{ code: payload.code, status: "Upcoming" }],
  });
  if (isCodeMatch) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Please enter a new code");
  }

  payload.parent = isParentExist._id;
  payload.professional = isProfessionalExist._id;
  payload.status = "Upcoming";
  // payload.day = dayjs(payload.date).format("dddd");

  const sessionResult = await SessionModel.create(payload);

  const updatedSession = await SessionModel.findByIdAndUpdate(
    sessionResult._id,
    { code: payload.code },
    { new: true },
  );

  if (updatedSession) {
    await sendAssignmentEmail(
      updatedSession.professional,
      updatedSession.parent,
      updatedSession.code,
    );
  }

  return updatedSession;
};

export const adminServices = {
  getAllParents,
  getAllProfessionals,
  getEachParent,
  assignProfessional,
  setCodeForSession,
  getAllSessions,
  assignProfessionalAndSetCode,
};
