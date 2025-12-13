import HttpStatus from "http-status";
import AppError from "../../erros/AppError";
import IEvent from "./event.interface";
import { EventModel } from "./event.model";
import QueryBuilder from "../../../builder/QueryBuilder";

const addEvent = async (payload: IEvent) => {
  const date = new Date(payload.eventDate);

  // Check if there is an existing event at the same date, time, and is not deleted
  const isSameTimeDateEventExist = await EventModel.findOne({
    eventDate: date,
    startTime: payload.startTime,
    endTime: payload.endTime,
    status: "Upcoming",
    isDeleted: { $ne: true }, // This ensures the event is not deleted
  });

  // If there's an event that hasn't been deleted yet, throw an error
  if (isSameTimeDateEventExist) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "An event has already been scheduled at the same date & time which is not completed yet.",
    );
  }

  const result = await EventModel.create(payload);
  if (!result) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Event creation failed");
  }

  return result;
};

const getAllEvents = async (query: Record<string, unknown>) => {
  const eventQuery = new QueryBuilder(
    EventModel.find({ isDeleted: false }).sort({ createdAt: -1 }),
    query,
  )
    .filter()
    .fields()
    .paginate()
    .sort();

  const meta = await eventQuery.countTotal();
  const result = await eventQuery.modelQuery;
  return { meta, result };
};

const removeEvent = async (eventId: string) => {
  const isEventExist = await EventModel.findById(eventId);
  if (!isEventExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Event not found");
  }
  const result = await EventModel.findByIdAndUpdate(
    isEventExist._id,
    {
      isDeleted: true,
    },
    { new: true },
  );
  return result;
};

export const eventServices = {
  addEvent,
  getAllEvents,
  removeEvent,
};
