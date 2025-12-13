import HttpStatus from "http-status";
import { NextFunction, Request, Response } from "express";
import catchAsync from "../utils/catchAsync";
import config from "../config";
import { UserModel } from "../modules/User/user.model";
import AppError from "../erros/AppError";
import { JwtPayload, TUserRole } from "../interface/global";
import { verifyToken } from "../utils/jwt";

const auth = (...requiredRoles: TUserRole[]) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const headerToken = req.headers.authorization;
    if (!headerToken || !headerToken.startsWith("Bearer ")) {
      throw new AppError(
        HttpStatus.UNAUTHORIZED,
        "No token provided or bad format",
      );
    }
    // console.log(headerToken);
    const token = headerToken?.split(" ")[1];
    if (!token) {
      throw new AppError(HttpStatus.UNAUTHORIZED, "You are not authorized");
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyToken(token, config.jwt_access_secret as string) as JwtPayload
    } catch (error) {
      console.log(error);
      throw new AppError(HttpStatus.UNAUTHORIZED, "Unauthorized");
    }

    console.log(decoded);
    const { role, email, iat } = decoded;

    // Proceed with other checks for non-student roles
    const user = await UserModel.isUserExistByEmail(email);
    if (!user) {
      throw new AppError(HttpStatus.NOT_FOUND, "This User is not exist");
    }
    if (user?.isDeleted) {
      throw new AppError(HttpStatus.FORBIDDEN, "This User is deleted");
    }
    if (role === undefined) {
      throw new Error("Role is undefined");
    }
    // console.log(role);

    if (requiredRoles && !requiredRoles.includes(role)) {
      throw new AppError(HttpStatus.UNAUTHORIZED, "You are not authorized");
    }
    if (
      user.passwordChangedAt &&
      (await UserModel.isOldTokenValid(user.passwordChangedAt, iat as number))
    ) {
      throw new AppError(HttpStatus.UNAUTHORIZED, "You are not authorized");
    }

    req.user = decoded as JwtPayload;
    next();
  });
};

export default auth;
