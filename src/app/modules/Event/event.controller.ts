import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { eventServices } from "./event.service";

const addEvent = catchAsync(async (req, res) => {
  const result = await eventServices.addEvent(req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset email sent successfully",
    data: result,
  });
});

const getAllEvents = catchAsync(async (req, res) => {
  const result = await eventServices.getAllEvents(req.query);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset email sent successfully",
    data: result,
  });
});

export const eventControllers = {
  addEvent,
  getAllEvents,
};
