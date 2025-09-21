/* eslint-disable @typescript-eslint/no-explicit-any */
import HttpStatus from "http-status";
import mongoose, { Types } from "mongoose";
import { JwtPayload } from "../../interface/global";
import { UserModel } from "../User/user.model";
import { IParent } from "./parent.interface";
import AppError from "../../erros/AppError";
import { sendFileToCloudinary } from "../../utils/sendImageToCloudinary";
import { ParentModel } from "./parent.model";

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

export const parentServices = {
  createParent,
};
