import HttpStatus from "http-status";
import { Types } from "mongoose";
import { JwtPayload } from "../../interface/global";
import { UserModel } from "../User/user.model";
import AppError from "../../erros/AppError";
import { SessionModel } from "./session.model";

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

export const sessionServices = {
  getMySessions,
};
