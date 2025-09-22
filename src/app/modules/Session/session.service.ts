import HttpStatus from "http-status";
import { Types } from "mongoose";
import { JwtPayload } from "../../interface/global";
import { UserModel } from "../User/user.model";
import AppError from "../../erros/AppError";
import { SessionModel } from "./session.model";
import { ProfessionalModel } from "../Professional/professional.model";

const getMySessions = async (user: JwtPayload) => {
  const userId = new Types.ObjectId(user.user);
  const isUserExist = await UserModel.findById(userId);
  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "The user is not exist");
  }
  if (user.role === "parent") {
    const parentSessions = await SessionModel.find({
      parent: isUserExist.roleId,
    });
    if (!parentSessions) {
      throw new AppError(HttpStatus.NOT_FOUND, "Sessions not available");
    }
    return parentSessions;
  }
  if (user.role === "professional") {
    const professionalSessions = await SessionModel.find({
      professional: isUserExist.roleId,
    });
    if (!professionalSessions) {
      throw new AppError(HttpStatus.NOT_FOUND, "Sessions not available");
    }
    return professionalSessions;
  }
  throw new AppError(HttpStatus.NOT_FOUND, "Something went wrong");
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
  const isSessionExist = await SessionModel.findById(id);
  if (!isSessionExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Session not found");
  }
  return isSessionExist;
};

export const sessionServices = {
  getMySessions,
  updateSessionStatus,
  getEachSession,
};
