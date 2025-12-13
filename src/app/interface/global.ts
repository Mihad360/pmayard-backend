/* eslint-disable @typescript-eslint/no-namespace */
import { Types } from "mongoose";
import { Server as SocketIo } from "socket.io";

export interface JwtPayload {
  user: Types.ObjectId | string;
  email: string;
  role: "admin" | "professional" | "parent" | undefined;
  // name?: string;
  // profileImage?: string;
  // isDeleted?: boolean;
  iat?: number;
  // exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
  namespace NodeJS {
    interface Global {
      io: SocketIo;
    }
  }
}

export const USER_ROLE = {
  admin: "admin",
  professional: "professional",
  parent: "parent",
} as const;

export type TUserRole = keyof typeof USER_ROLE;
