import HttpStatus from "http-status";
import AppError from "../../erros/AppError";
import { IEditUserProfilePayload, IUser } from "./user.interface";
import { UserModel } from "./user.model";
import { JwtPayload } from "../../interface/global";
import mongoose, { Types } from "mongoose";
import { INotification } from "../Notification/notification.interface";
import { createNotification } from "../Notification/notification.service";
import { ProfessionalModel } from "../Professional/professional.model";
import { sendFileToCloudinary } from "../../utils/sendImageToCloudinary";
import { ParentModel } from "../Parent/parent.model";
import { IProfessional } from "../Professional/professional.interface";
import { IParent } from "../Parent/parent.interface";
import { ConversationModel } from "../Conversation/conversation.model";
import { ConversationType } from "../Conversation/conversation.interface";
import { generateOtp, verificationEmailTemplate } from "../Auth/auth.utils";
import { sendEmail } from "../../utils/sendEmail";

const registerUser = async (payload: IUser) => {
  const isUserExist = await UserModel.findOne({ email: payload.email });
  if (isUserExist) {
    throw new AppError(HttpStatus.BAD_REQUEST, "The same user already exists");
  }

  // Create the user in the database
  const result = await UserModel.create(payload);

  if (result) {
    // Generate OTP for email verification
    const otp = generateOtp();
    const expireAt = new Date(Date.now() + 5 * 60 * 1000); // OTP expires in 5 minutes

    // Update user with OTP and expiration time
    const updatedUser = await UserModel.findByIdAndUpdate(
      result._id,
      {
        otp: otp,
        expiresAt: expireAt,
      },
      { new: true },
    ).select("-password -otp -passwordChangedAt");

    if (updatedUser) {
      // Send OTP via email
      const subject = "Verification Code";
      const mail = await sendEmail(
        result.email,
        subject,
        verificationEmailTemplate(result.email, otp as string),
      );

      if (!mail) {
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          "Something went wrong while sending OTP",
        );
      }

      // Send registration notification
      const notInfo: INotification = {
        sender: new Types.ObjectId(result._id),
        type: "user_registration",
        message: `User Registered: (${result.email})`,
      };
      await createNotification(notInfo);

      return {
        data: updatedUser,
      };
    }
  }

  throw new AppError(HttpStatus.BAD_REQUEST, "User registration failed.");
};

const getMe = async (user: JwtPayload) => {
  const userId = new Types.ObjectId(user.user);
  const isUserExist = await UserModel.findById(userId).select("-password");

  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "The user does not exist");
  }

  if (isUserExist.isDeleted) {
    throw new AppError(HttpStatus.NOT_FOUND, "The user is blocked");
  }

  // Skip population if role is 'admin'
  if (isUserExist.role !== "admin") {
    await isUserExist.populate("roleId");
  }

  return isUserExist;
};

const editUserProfile = async (
  id: string,
  file: Express.Multer.File,
  payload: Partial<IEditUserProfilePayload>,
) => {
  // Find the user by ID
  const user = await UserModel.findById(id);
  if (!user) {
    throw new AppError(HttpStatus.NOT_FOUND, "The user does not exist");
  }
  if (user.isDeleted) {
    throw new AppError(HttpStatus.FORBIDDEN, "The user is blocked");
  }

  let userUpdateData: IProfessional | IParent | IUser | null = null;
  const updateData: Partial<IEditUserProfilePayload> = {};

  // Handle email update if provided
  if (payload.email) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Email cannot be updated");
  }

  // Handle image upload
  if (file) {
    const imageName = `${payload.name || "default"}`;
    const imageInfo = await sendFileToCloudinary(
      file.buffer,
      imageName,
      file.mimetype,
    );
    updateData.profileImage = imageInfo.secure_url;
  }

  // ==================================================
  // 🔥 ROLE LOGIC STARTS HERE
  // ==================================================

  // ---------- ADMIN ----------
  if (user.role === "admin") {
    const admin = await UserModel.findById(user._id);
    if (!admin)
      throw new AppError(HttpStatus.NOT_FOUND, "admin role not found");

    if (payload.name) updateData.name = payload.name;

    userUpdateData = await UserModel.findByIdAndUpdate(
      admin._id,
      {
        name: updateData.name,
        profileImage: updateData.profileImage,
      },
      { new: true },
    ).select("-password");
  }

  // ---------- PROFESSIONAL ----------
  else if (user.role === "professional") {
    const professional = await ProfessionalModel.findById(user.roleId);
    if (!professional) {
      throw new AppError(HttpStatus.NOT_FOUND, "Professional role not found");
    }

    // Base field updates
    if (payload.name) updateData.name = payload.name;
    if (payload.phoneNumber) updateData.phoneNumber = payload.phoneNumber;

    // 🔥 SUBJECT UPDATE (Professional)
    if (payload.subjects) {
      updateData.subjects = payload.subjects; // subjects from role model
    }
    if (payload.bio) {
      updateData.bio = payload.bio; // subjects from role model
    }

    userUpdateData = await ProfessionalModel.findByIdAndUpdate(
      professional._id,
      {
        $set: updateData,
      },
      { new: true },
    ).select("-availability");
  }

  // ---------- PARENT ----------
  else if (user.role === "parent") {
    const parent = await ParentModel.findById(user.roleId);
    if (!parent) {
      throw new AppError(HttpStatus.NOT_FOUND, "Parent role not found");
    }

    // Base field updates
    if (payload.name) updateData.name = payload.name;
    if (payload.phoneNumber) updateData.phoneNumber = payload.phoneNumber;

    // 🔥 SUBJECT UPDATE (Parent)
    if (payload.subjects) {
      updateData.subjects = payload.subjects; // subjects from role model
    }
    if (payload.bio) {
      updateData.bio = payload.bio; // subjects from role model
    }

    userUpdateData = await ParentModel.findByIdAndUpdate(
      parent._id,
      {
        $set: updateData,
      },
      { new: true },
    ).select("-availability");
  }

  // ==================================================
  // 🔥 UPDATE USER EMAIL (if provided)
  // ==================================================
  if (updateData.email) {
    await UserModel.findByIdAndUpdate(
      id,
      { $set: { email: updateData.email } },
      { new: true },
    ).select("-password -otp -expiresAt -isVerified -passwordChangedAt");
  }
  console.log(userUpdateData);
  return userUpdateData;
};

const deleteUser = async (id: string) => {
  const user = await UserModel.findById(id);
  if (!user) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }
  if (user.isDeleted) {
    throw new AppError(HttpStatus.BAD_REQUEST, "User already deleted");
  }

  const result = await UserModel.findByIdAndUpdate(
    user._id,
    {
      isDeleted: true,
    },
    { new: true },
  ).select("-password -otp -expiresAt -isVerified -passwordChangedAt");
  return result;
};

const createRole = async (
  file: Express.Multer.File,
  user: JwtPayload,
  payload: IProfessional | IParent, // This can be either a Professional or Parent payload
  // role: "Professional" | "Parent", // Pass role explicitly
) => {
  const userId = new Types.ObjectId(user.user);
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Step 1: Check if the user exists
    const isUserExist = await UserModel.findById(userId).populate("roleId");
    if (!isUserExist) {
      throw new AppError(HttpStatus.NOT_FOUND, "The user is not found");
    }

    // Step 2: Check if the role (Professional or Parent) already exists
    let isRoleExist;
    if (user.role === "professional") {
      isRoleExist = await ProfessionalModel.findById(isUserExist.roleId);
      if (isRoleExist) {
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          "The professional already exists",
        );
      }
    } else if (user.role === "parent") {
      isRoleExist = await ParentModel.findById(isUserExist.roleId);
      if (isRoleExist) {
        throw new AppError(HttpStatus.BAD_REQUEST, "The parent already exists");
      }
    }

    // Step 3: Check if the file is provided
    if (!file) {
      throw new AppError(HttpStatus.NOT_FOUND, "The file is not found");
    }

    // Step 4: Upload the file to Cloudinary
    const result = await sendFileToCloudinary(
      file.buffer,
      file.originalname,
      file.mimetype,
    );
    if (result) {
      payload.profileImage = result?.secure_url;
      payload.user = isUserExist._id;

      // Step 5: Create the role in the database (Professional or Parent)
      let createdRole;
      if (user.role === "professional") {
        createdRole = await ProfessionalModel.create([payload], { session });
      } else if (user.role === "parent") {
        createdRole = await ParentModel.create([payload], { session });
      }

      if (createdRole) {
        const notInfo: INotification = {
          sender: new Types.ObjectId(createdRole[0]?.user),
          type: "user_join",
          message: `${user.role} joined the app: (${createdRole[0]?.name})`,
        };
        await createNotification(notInfo);
      }

      // Step 6: Update the user with the roleId and roleRef (Professional or Parent)
      await UserModel.findByIdAndUpdate(
        isUserExist._id,
        {
          roleId: createdRole?.[0]._id,
          roleRef: user.role === "parent" ? "Parent" : "Professional",
        },
        { new: true, session },
      );

      // Step 7: Find the Admin user (assuming roleRef identifies admins)
      const adminUser = await UserModel.findOne({ roleRef: "Admin" });
      if (!adminUser) {
        throw new AppError(HttpStatus.NOT_FOUND, "Admin user not found");
      }

      // Step 8: Create an individual conversation between Admin and the new role (Professional or Parent)
      const individualConversation = new ConversationModel({
        type: ConversationType.INDIVIDUAL,
        users: [adminUser._id, createdRole?.[0].user],
        isDeleted: false,
      });

      const savedIndividualConversation = await individualConversation.save({
        session,
      });

      // Step 9: Check if the group conversation exists (Admin and all Professionals/Parents)
      let groupConversation = await ConversationModel.findOne({
        type: ConversationType.GROUP,
        conversationName: `${user.role === "parent" ? "Parents" : "Professionals"} Group`, // Group name dynamic based on role
        users: { $in: [adminUser._id] }, // Admin should already be part of the group
      });

      if (!groupConversation) {
        // Step 10: If no existing group conversation, create a new one
        groupConversation = new ConversationModel({
          type: ConversationType.GROUP,
          conversationName: `${user.role === "parent" ? "Parents" : "Professionals"} Group`, // Dynamic group name based on role
          users: [adminUser._id, createdRole?.[0].user], // Add Admin and the new role
          isDeleted: false,
        });
        await groupConversation.save({ session });
      } else {
        // Step 11: If the group conversation exists, add the new role to the group
        if (createdRole?.[0].user) {
          if (!groupConversation.users.includes(createdRole?.[0].user)) {
            groupConversation.users.push(createdRole?.[0].user);
            await groupConversation.save({ session });
          }
        } else {
          throw new AppError(
            HttpStatus.BAD_REQUEST,
            "User ID for the created role is not valid",
          );
        }
      }

      // Commit the transaction after all steps
      await session.commitTransaction();

      return {
        createdRole: createdRole?.[0],
        individualConversation: savedIndividualConversation,
        groupConversation: groupConversation,
      };
    }

    throw new AppError(HttpStatus.BAD_REQUEST, "File upload failed");
  } catch (error) {
    // Abort the transaction if an error occurs
    await session.abortTransaction();
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      error ? (error as any) : "An error occurred",
    );
  } finally {
    // End the session
    await session.endSession();
  }
};

const removeUser = async (id: string) => {
  const result = await UserModel.findByIdAndDelete(id);
  return result;
};

export const userServices = {
  registerUser,
  getMe,
  editUserProfile,
  deleteUser,
  createRole,
  removeUser,
};
