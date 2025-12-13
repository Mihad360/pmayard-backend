import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { eventServices } from "./event.service";

const addEvent = catchAsync(async (req, res) => {
  const result = await eventServices.addEvent(req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Event added successfully",
    data: result,
  });
});

const getAllEvents = catchAsync(async (req, res) => {
  const result = await eventServices.getAllEvents(req.query);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Events retrieved successfully",
    data: result,
  });
});

const removeEvent = catchAsync(async (req, res) => {
  const id = req.params.eventId;
  const result = await eventServices.removeEvent(id);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Event removed successfully",
    data: result,
  });
});

export const eventControllers = {
  addEvent,
  getAllEvents,
  removeEvent,
};
