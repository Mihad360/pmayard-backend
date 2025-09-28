import HttpStatus from "http-status";
import AppError from "../../erros/AppError";
import IEvent from "./event.interface";
import { EventModel } from "./event.model";
import QueryBuilder from "../../../builder/QueryBuilder";

const addEvent = async (payload: IEvent) => {
  const date = new Date(payload.eventDate);
  const isSameTimeDateEventExist = await EventModel.findOne({
    eventDate: date,
    startTime: payload.startTime,
    endTime: payload.endTime,
    status: "Upcoming",
  });
  if (isSameTimeDateEventExist) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Already a event has scheduled at the same date & time whitch is not completed yet",
    );
  }
  const result = await EventModel.create(payload);
  if (!result) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Event create failed");
  }
  return result;
};

const getAllEvents = async (query: Record<string, unknown>) => {
  const eventQuery = new QueryBuilder(
    EventModel.find().sort({ createdAt: -1 }),
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

export const eventServices = {
  addEvent,
  getAllEvents,
};
