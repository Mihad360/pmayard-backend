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
import dayjs from "dayjs";

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
    SessionModel.find({ isDeleted: false })
      .populate({ path: "parent", select: "name profileImage" })
      .populate({ path: "professional", select: "name profileImage" }),
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

const getAllParentAssignedProfessionals = async (parentId: string) => {
  // Find all sessions associated with the parent where the status is 'upcoming'
  const sessions = await SessionModel.find({
    parent: parentId,
    status: "Upcoming",
    isDeleted: false,
  }).populate({
    path: "professional", // Populate the 'professional' field in the session model
    select: "name profileImage email phoneNumber user",
    populate: { path: "user", select: "email" },
  });

  // If no sessions are found, throw an error
  if (!sessions || sessions.length === 0) {
    throw new AppError(
      HttpStatus.NOT_FOUND,
      "No upcoming sessions found for this parent",
    );
  }

  // Retrieve professional-session data with their subject
  const professionalSessionData = sessions.flatMap((session) => {
    if (!session.professional) return []; // Handle case where professional is undefined

    // Return professional with their session data (each session creates a new entry with subject)
    return session;
  });

  // If no professionals are found, throw an error
  if (professionalSessionData.length === 0) {
    throw new AppError(
      HttpStatus.NOT_FOUND,
      "No professionals assigned to upcoming sessions",
    );
  }

  // Return the detailed list with professional and session details including subject
  return professionalSessionData;
};

const removeSession = async (sessionId: string) => {
  const isSessionExist = await SessionModel.findById(sessionId);
  if (!isSessionExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Session not found");
  }

  // If the session is confirmed, handle the slot status update
  if (isSessionExist.status === "Confirmed") {
    const professional = await ProfessionalModel.findById(
      isSessionExist.professional,
    );

    if (!professional) {
      throw new AppError(HttpStatus.NOT_FOUND, "Professional not found");
    }

    const day = dayjs(isSessionExist.date).format("dddd");
    const availabilityForDay = professional.availability.find(
      (avail) => avail.day === day,
    );

    if (!availabilityForDay) {
      throw new AppError(
        HttpStatus.NOT_FOUND,
        "Professional is not available on this day",
      );
    }

    const timeslotToUpdate = availabilityForDay.timeSlots.find(
      (slot) =>
        slot.startTime === isSessionExist?.time?.startTime &&
        slot.endTime === isSessionExist?.time?.endTime &&
        slot.status === "booked",
    );

    if (timeslotToUpdate) {
      // Mark the timeslot as available before deletion
      timeslotToUpdate.status = "available";
      await professional.save();
    } else {
      throw new AppError(
        HttpStatus.NOT_FOUND,
        "Timeslot not found or already available",
      );
    }
  }

  // Mark the session as deleted
  const result = await SessionModel.findByIdAndUpdate(
    isSessionExist._id,
    {
      isDeleted: true,
    },
    { new: true },
  );

  return result;
};

export const adminServices = {
  getAllParents,
  getAllProfessionals,
  getEachParent,
  assignProfessional,
  setCodeForSession,
  getAllSessions,
  assignProfessionalAndSetCode,
  getAllParentAssignedProfessionals,
  removeSession,
};
