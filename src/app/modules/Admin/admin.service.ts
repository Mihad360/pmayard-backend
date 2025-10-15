/* eslint-disable @typescript-eslint/no-explicit-any */
import HttpStatus from "http-status";
import mongoose, { Types } from "mongoose";
import { JwtPayload } from "../../interface/global";
import { UserModel } from "../User/user.model";
import AppError from "../../erros/AppError";
import { ParentModel } from "../Parent/parent.model";
import QueryBuilder from "../../../builder/QueryBuilder";
import {
  professionalSearch,
  sendAssignmentEmail,
  sessionSearch,
} from "./admin.utils";
import { ProfessionalModel } from "../Professional/professional.model";
import { ISession } from "../Session/session.interface";
import { SessionModel } from "../Session/session.model";
import dayjs from "dayjs";
import { INotification } from "../Notification/notification.interface";
import { createNotification } from "../Notification/notification.service";

const getAllParents = async (
  user: JwtPayload,
  query: Record<string, unknown>,
) => {
  const userId = new Types.ObjectId(user.user);
  const isUserExist = await UserModel.findById(userId);

  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "The user does not exist");
  }

  const { searchTerm, page = 1, pageSize = 10 } = query;
  const currentPage = Number(page) || 1;
  const itemsPerPage = Number(pageSize) || 10;

  // Create base pipeline with explicit typing
  const aggregationPipeline: any[] = [
    {
      $match: { isDeleted: false },
    },
    // Lookup user to get email
    {
      $lookup: {
        from: "users", // Assuming your User collection name
        localField: "user", // The field in Parent that references User
        foreignField: "_id", // The _id field in User collection
        as: "userInfo",
      },
    },
    {
      $unwind: {
        path: "$userInfo",
        preserveNullAndEmptyArrays: true, // In case some parents don't have user reference
      },
    },
  ];

  // Add search stage if searchTerm exists (now including email from userInfo)
  if (searchTerm) {
    aggregationPipeline.push({
      $match: {
        $or: [
          { name: { $regex: searchTerm, $options: "i" } },
          { childs_name: { $regex: searchTerm, $options: "i" } },
          { childs_grade: { $regex: searchTerm, $options: "i" } },
          { "userInfo.email": { $regex: searchTerm, $options: "i" } }, // Search in email from user
        ],
      },
    });
  }

  // Add session lookup and other stages
  aggregationPipeline.push(
    {
      $lookup: {
        from: "sessions",
        localField: "_id",
        foreignField: "parent",
        as: "sessions",
      },
    },
    {
      $project: {
        email: "$userInfo.email", // Get email from userInfo
        name: 1,
        childs_name: 1,
        childs_grade: 1,
        phoneNumber: 1,
        profileImage: 1,
        bookedSessions: {
          $size: {
            $filter: {
              input: "$sessions",
              as: "session",
              cond: { $ne: ["$$session.status", "Canceled"] },
            },
          },
        },
      },
    },
    {
      $sort: { bookedSessions: -1 },
    },
    {
      $skip: (currentPage - 1) * itemsPerPage,
    },
    {
      $limit: itemsPerPage,
    },
  );

  const result = await ParentModel.aggregate(aggregationPipeline);

  // Count pipeline - needs to match the same filtering logic
  const countPipeline: any[] = [
    {
      $match: { isDeleted: false },
    },
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "userInfo",
      },
    },
    {
      $unwind: {
        path: "$userInfo",
        preserveNullAndEmptyArrays: true,
      },
    },
  ];

  if (searchTerm) {
    countPipeline.push({
      $match: {
        $or: [
          { name: { $regex: searchTerm, $options: "i" } },
          { childs_name: { $regex: searchTerm, $options: "i" } },
          { childs_grade: { $regex: searchTerm, $options: "i" } },
          { "userInfo.email": { $regex: searchTerm, $options: "i" } },
        ],
      },
    });
  }

  countPipeline.push({
    $count: "total",
  });

  const total = await ParentModel.aggregate(countPipeline);

  return {
    meta: {
      total: total[0]?.total || 0,
      page: currentPage,
      pageSize: itemsPerPage,
      totalPages: Math.ceil((total[0]?.total || 0) / itemsPerPage),
    },
    result,
  };
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
  userId: string,
) => {
  const session = await mongoose.startSession(); // Start a session for the transaction

  try {
    session.startTransaction(); // Begin the transaction

    // Check if Parent exists
    const isParentExist = await ParentModel.findById(parentId).session(session);
    if (!isParentExist) {
      throw new AppError(HttpStatus.NOT_FOUND, "Parent not found");
    }

    // Check if Professional exists
    const isProfessionalExist =
      await ProfessionalModel.findById(professionalId).session(session);
    if (!isProfessionalExist) {
      throw new AppError(HttpStatus.NOT_FOUND, "Professional not found");
    }

    // Check if Professional has available time slots
    const availability = isProfessionalExist.availability;
    const isAvailable = availability.some((avail) =>
      avail.timeSlots.find((slot) => slot.status === "available"),
    );

    if (!isAvailable) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "No available time slots for this professional",
      );
    }

    // Check if the code already exists for an upcoming session
    const isCodeMatch = await SessionModel.findOne({
      $and: [{ code: payload.code, status: "Upcoming" }],
    }).session(session);
    if (isCodeMatch) {
      throw new AppError(HttpStatus.BAD_REQUEST, "Please enter a new code");
    }

    // Set the parent and professional in the payload and set the session status
    payload.parent = isParentExist._id;
    payload.professional = isProfessionalExist._id;
    payload.status = "Upcoming";

    // Create the session
    const sessionResult = await SessionModel.create([payload], { session });
    const updatedSession = await SessionModel.findByIdAndUpdate(
      sessionResult[0]._id,
      { code: payload.code },
      { new: true, session },
    );
    console.log(updatedSession);
    if (updatedSession) {
      // Send assignment email for both professional and parent
      const senderId = new Types.ObjectId(userId);
      await sendAssignmentEmail(
        updatedSession.professional,
        updatedSession.parent,
        updatedSession.code,
      );

      // Create notifications for both parent and professional
      const notInfo: INotification = {
        sender: senderId,
        recipient: updatedSession.parent,
        type: "tutor_assigned",
        message: `A new Tutor assigned to you: (${isProfessionalExist.name})`,
      };
      await createNotification(notInfo, session);

      const notInfos: INotification = {
        sender: senderId,
        recipient: updatedSession.professional,
        type: "parent_assigned",
        message: `A new Parent assigned to you: (${isParentExist.name})`,
      };
      console.log(notInfos);
      await createNotification(notInfos, session);
    }

    // Commit the transaction
    await session.commitTransaction();
    session.endSession(); // End the session

    return updatedSession;
  } catch (error) {
    // If any error occurs, abort the transaction
    await session.abortTransaction();
    session.endSession(); // End the session
    throw error; // Rethrow the error to be handled in the controller or elsewhere
  }
};

const getAllParentAssignedProfessionals = async (parentId: string) => {
  // Find all sessions associated with the parent where the status is 'upcoming'
  const sessions = await SessionModel.find({
    parent: parentId,
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

const getDashboardData = async (year?: number, month?: number) => {
  try {
    // Build the match criteria based on the year and month provided
    const matchCriteria: any = { isDeleted: false };

    if (year) {
      matchCriteria["date"] = {
        $gte: new Date(`${year}-01-01`),
        $lt: new Date(`${year + 1}-01-01`),
      }; // Filter by year
    }

    if (month) {
      matchCriteria["date"] = {
        ...matchCriteria["date"],
        $gte: new Date(`${year}-${month < 10 ? "0" + month : month}-01`),
        $lt: new Date(`${year}-${month < 10 ? "0" + month : month}-31`),
      }; // Filter by month
    }

    // Fetch the monthly session data
    const monthlySessions = await SessionModel.aggregate([
      { $match: matchCriteria },
      {
        $project: {
          month: { $month: "$date" },
          year: { $year: "$date" },
        },
      },
      {
        $group: {
          _id: { year: "$year", month: "$month" },
          totalSessions: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Get card data: total sessions, total parents, total tutors
    const totalSessions = await SessionModel.countDocuments({
      isDeleted: false,
    });
    const totalParents = await ParentModel.countDocuments({});
    const totalTutors = await ProfessionalModel.countDocuments({});

    return {
      monthlySessions,
      totalSessions,
      totalParents,
      totalTutors,
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    throw new Error("Error fetching dashboard data");
  }
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
  getDashboardData,
};
