import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { parentServices } from "./parent.service";
import { JwtPayload } from "../../interface/global";

const createParent = catchAsync(async (req, res) => {
  const file = req.file as Express.Multer.File;
  const user = req.user as JwtPayload;
  const result = await parentServices.createParent(file, user, req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Parent created successfully",
    data: result,
  });
});

export const parentControllers = {
  createParent,
};
