/* eslint-disable @typescript-eslint/no-explicit-any */
import HttpStatus from "http-status";
import { Types } from "mongoose";
import { JwtPayload } from "../../interface/global";
import { UserModel } from "../User/user.model";
import AppError from "../../erros/AppError";
import { SessionModel } from "./session.model";
import { ProfessionalModel } from "../Professional/professional.model";
import QueryBuilder from "../../../builder/QueryBuilder";
import { ParentModel } from "../Parent/parent.model";

const getMySessions = async (
  user: JwtPayload,
  query: Record<string, unknown>,
) => {
  const userId = new Types.ObjectId(user.user);

  const isUserExist = await UserModel.findById(userId);
  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "User does not exist");
  }

  let filter: Record<string, unknown> = {};
  let populateOptions: any = {};

  // ============================
  // ROLE CHECK & FILTER BUILDING
  // ============================
  if (user.role === "parent") {
    filter = { parent: isUserExist.roleId };

    // Parent → populate professional (full data)
    populateOptions = { path: "professional", select: "-availability" };
  } else if (user.role === "professional") {
    filter = { professional: isUserExist.roleId };

    // Professional → populate parent BUT remove the "availability" field
    populateOptions = {
      path: "parent",
    };
  } else {
    throw new AppError(HttpStatus.UNAUTHORIZED, "Invalid role");
  }

  // ============================
  // QUERY BUILDER STARTS HERE
  // ============================
  const sessionQuery = new QueryBuilder(
    SessionModel.find(filter).populate(populateOptions),
    query,
  )
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await sessionQuery.countTotal();
  const result = await sessionQuery.modelQuery;

  return { meta, result };
};

const updateSessionStatus = async (
  id: string,
  payload: { status: "Completed" | "Canceled" },
) => {
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
  const result = await SessionModel.findByIdAndUpdate(
    isSessionExist._id,
    {
      status: payload.status,
    },
    {
      new: true,
    },
  );
  if (result) {
    const professional = isProfessionalExist;

    const availabilityForDay = professional.availability.find(
      (avail) => avail.day === isSessionExist.day,
    );

    const timeslotToUpdate = availabilityForDay?.timeSlots.find(
      (slot) =>
        slot.startTime === isSessionExist?.time?.startTime &&
        slot.endTime === isSessionExist?.time?.endTime &&
        slot.status === "booked",
    );
    if (timeslotToUpdate) {
      timeslotToUpdate.status = "available";
      await professional.save();
      return result;
    }
  } else {
    throw new AppError(HttpStatus.BAD_REQUEST, "Something went wrong");
  }
};

const getEachSession = async (id: string) => {
  const isSessionExist = await SessionModel.findById(id)
    .populate({
      path: "parent",
    })
    .populate({ path: "professional" });
  if (!isSessionExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Session not found");
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

  if (isUserExist.role === "parent") {
    filter = { parent: isUserExist.roleId, isDeleted: false };
  } else if (isUserExist.role === "professional") {
    filter = { professional: isUserExist.roleId, isDeleted: false };
  } else {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Invalid role. Only parent or professional allowed",
    );
  }

  const session = await SessionModel.find(filter)
    .select("-code -isSessionVerified -time")
    .populate({
      path: "parent",
      select: "name profileImage",
      populate: { path: "user", select: "email role" },
    })
    .populate({
      path: "professional",
      select: "name profileImage",
      populate: { path: "user", select: "email role" },
    });

  if (!session) {
    throw new AppError(HttpStatus.NOT_FOUND, "Session not found");
  }

  return session;
};

const getUpcomingSessions = async (
  user: JwtPayload,
  query: Record<string, unknown>,
) => {
  const userId = new Types.ObjectId(user.user);
  const isUserExist = await UserModel.findById(userId);

  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }

  let filter: any = {};

  if (isUserExist.role === "parent") {
    filter = {
      parent: isUserExist.roleId,
      isDeleted: false,
      status: "Upcoming",
    };
  } else if (isUserExist.role === "professional") {
    filter = {
      professional: isUserExist.roleId,
      isDeleted: false,
      status: { $in: ["Upcoming", "Confirmed"] },
    };
  } else {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Invalid role. Only parent or professional allowed",
    );
  }

  // 🔥 FULL POPULATE (parent + professional)
  const sessionQuery = SessionModel.find(filter).populate({
    path: "parent professional",
    select: "-availability",
    populate: {
      path: "user",
      select: "email",
    },
  });

  // Apply Query Builder (pagination, filtering)
  const session = new QueryBuilder(sessionQuery, query).filter();

  if (!session) {
    throw new AppError(HttpStatus.NOT_FOUND, "Session not found");
  }

  const meta = await session.countTotal();
  const result = await session.modelQuery;

  return { meta, result };
};

const getEachRole = async (id: string, user: JwtPayload) => {
  if (user.role === "professional") {
    const parent = await ParentModel.findById(id).populate({
      path: "user",
      select: "-password -otp -expiresAt",
    });

    if (!parent) {
      throw new AppError(HttpStatus.NOT_FOUND, "Parent not found");
    }
    return parent;
  }

  // If professional → search ProfessionalModel
  if (user.role === "parent") {
    const prof = await ProfessionalModel.findById(id)
      .select("-availability")
      .populate({
        path: "user",
        select: "-password -otp -expiresAt",
      });

    if (!prof) {
      throw new AppError(HttpStatus.NOT_FOUND, "Professional not found");
    }
    return prof;
  }

  // For any other role
  throw new AppError(
    HttpStatus.BAD_REQUEST,
    "Invalid role. Only parent/professional allowed",
  );
};

export const sessionServices = {
  getMySessions,
  updateSessionStatus,
  getEachSession,
  getAssignedProfiles,
  getUpcomingSessions,
  getEachRole,
};
