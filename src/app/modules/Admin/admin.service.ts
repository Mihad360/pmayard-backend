/* eslint-disable @typescript-eslint/no-explicit-any */
import HttpStatus from "http-status";
import mongoose, { Types } from "mongoose";
import { JwtPayload } from "../../interface/global";
import { UserModel } from "../User/user.model";
import AppError from "../../erros/AppError";
import { ParentModel } from "../Parent/parent.model";
import QueryBuilder from "../../../builder/QueryBuilder";
import { sendAssignmentEmail, sessionSearch } from "./admin.utils";
import { ProfessionalModel } from "../Professional/professional.model";
import { ISession } from "../Session/session.interface";
import { SessionModel } from "../Session/session.model";
import dayjs from "dayjs";
import { INotification } from "../Notification/notification.interface";
import { createNotification } from "../Notification/notification.service";
import { ConversationModel } from "../Conversation/conversation.model";
import { ConversationType } from "../Conversation/conversation.interface";

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
        relationship_with_child: 1,
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
    throw new AppError(HttpStatus.NOT_FOUND, "The user does not exist");
  }

  const { searchTerm, page = 1, pageSize = 10 } = query;
  const currentPage = Number(page) || 1;
  const itemsPerPage = Number(pageSize) || 10;

  // Create base pipeline
  const aggregationPipeline: any[] = [
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

  // CORRECTED SEARCH - using actual Professional schema fields
  if (searchTerm) {
    aggregationPipeline.push({
      $match: {
        $or: [
          { name: { $regex: searchTerm, $options: "i" } },
          { qualification: { $regex: searchTerm, $options: "i" } },
          { subjects: { $regex: searchTerm, $options: "i" } }, // subjects exists (array)
          { "userInfo.email": { $regex: searchTerm, $options: "i" } },
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
        foreignField: "professional",
        as: "sessions",
      },
    },
    {
      $project: {
        email: "$userInfo.email",
        name: 1,
        qualification: 1,
        phoneNumber: 1,
        profileImage: 1,
        subjects: 1, // ADDED: Professional's subjects field directly from the model
        // Get subject from sessions (optional - if you still want it)
        sessionSubject: {
          $arrayElemAt: [
            {
              $map: {
                input: {
                  $filter: {
                    input: "$sessions",
                    as: "session",
                    cond: {
                      $and: [
                        { $ne: ["$$session.subject", null] },
                        { $ne: ["$$session.subject", ""] },
                      ],
                    },
                  },
                },
                as: "session",
                in: "$$session.subject",
              },
            },
            0,
          ],
        },
        totalSessions: {
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
      $sort: { totalSessions: -1 },
    },
    {
      $skip: (currentPage - 1) * itemsPerPage,
    },
    {
      $limit: itemsPerPage,
    },
  );

  const result = await ProfessionalModel.aggregate(aggregationPipeline);

  // Count pipeline - FIXED to match corrected search fields
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
          { qualification: { $regex: searchTerm, $options: "i" } },
          { subjects: { $regex: searchTerm, $options: "i" } },
          { "userInfo.email": { $regex: searchTerm, $options: "i" } },
        ],
      },
    });
  }

  countPipeline.push({
    $count: "total",
  });

  const total = await ProfessionalModel.aggregate(countPipeline);

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

    // Get userIds of parent and professional
    const parentUserId = isParentExist.user; // ObjectId of User
    const professionalUserId = isProfessionalExist.user;

    // Check if conversation already exists between them
    let conversation = await ConversationModel.findOne({
      users: { $all: [parentUserId, professionalUserId] },
      type: "individual",
    }).session(session);
    if (!conversation) {
      const created = await ConversationModel.create(
        [
          {
            type: ConversationType.INDIVIDUAL,
            users: [parentUserId, professionalUserId],
            isDeleted: false,
          },
        ],
        { session },
      );
      conversation = created[0];
    }
    payload.conversation_id = conversation._id;

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
  const aggregationPipeline = [
    {
      $match: {
        parent: new Types.ObjectId(parentId),
        isDeleted: false,
      },
    },
    {
      $lookup: {
        from: "professionals",
        localField: "professional",
        foreignField: "_id",
        as: "professional",
      },
    },
    {
      $unwind: {
        path: "$professional",
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "professional.user",
        foreignField: "_id",
        as: "professional.user",
      },
    },
    {
      $unwind: {
        path: "$professional.user",
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $project: {
        _id: 1,
        "professional._id": 1,
        "professional.name": 1,
        "professional.profileImage": 1,
        "professional.phoneNumber": 1,
        "professional.user.email": 1,
        subject: 1,
        sessionDate: 1, // include other session fields you need
        status: 1,
      },
    },
  ];

  const result = await SessionModel.aggregate(aggregationPipeline);

  if (!result || result.length === 0) {
    throw new AppError(
      HttpStatus.NOT_FOUND,
      "No upcoming sessions found for this parent",
    );
  }

  return result;
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

const getDashboardData = async (year?: number) => {
  try {
    console.log(year); // Debugging step to confirm the `year` is passed correctly.

    // Use current year if no year is provided
    const targetYear = year || new Date().getFullYear();

    // Initialize the match criteria with the year filter
    const matchCriteria: any = { isDeleted: false, date: { $ne: null } };

    // Apply year filter
    matchCriteria["date"] = {
      $ne: null,
      $gte: new Date(`${targetYear}-01-01`), // Start of the year
      $lt: new Date(`${targetYear + 1}-01-01`), // Start of the next year
    };

    // Fetch the monthly session data
    const monthlySessions = await SessionModel.aggregate([
      {
        $match: matchCriteria,
      },
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
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    // Create an array of all 12 months with sessions as 0
    const allMonths = Array.from({ length: 12 }, (_, i) => {
      const monthNumber = i + 1; // 1 to 12
      const formattedMonth = dayjs()
        .month(monthNumber - 1)
        .format("MMM");
      return {
        month: formattedMonth,
        monthNumber: monthNumber,
        sessions: 0,
      };
    });

    // Merge the actual session data with all months
    const result = allMonths.map((monthObj) => {
      const sessionData = monthlySessions.find(
        (session) => session._id.month === monthObj.monthNumber,
      );

      if (sessionData) {
        return {
          month: monthObj.month,
          sessions: sessionData.totalSessions,
        };
      }

      return {
        month: monthObj.month,
        sessions: 0,
      };
    });

    // Get card data: total sessions, total parents, total tutors
    const totalSessionsMatchCriteria: any = {
      isDeleted: false,
      date: { $ne: null },
    };

    if (year) {
      totalSessionsMatchCriteria.date = {
        $gte: new Date(`${targetYear}-01-01`),
        $lt: new Date(`${targetYear + 1}-01-01`),
      };
    }

    const totalSessions = await SessionModel.countDocuments(
      totalSessionsMatchCriteria,
    );
    const totalParents = await ParentModel.countDocuments({});
    const totalTutors = await ProfessionalModel.countDocuments({});

    return {
      monthlySessions: result,
      totalSessions,
      totalParents,
      totalTutors,
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
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
