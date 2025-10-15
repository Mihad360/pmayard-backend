import HttpStatus from "http-status";
import mongoose, { Types } from "mongoose";
import { JwtPayload } from "../../interface/global";
import { IMessage } from "../Message/message.interface";
import { ConversationModel } from "../Conversation/conversation.model";
import AppError from "../../erros/AppError";
import { sendFileToCloudinary } from "../../utils/sendImageToCloudinary";
import { Message } from "../Message/message.model";
import { AttachmentModel } from "./attachment.model";

const sendMessageByAttachment = async (
  files: Express.Multer.File[],
  conversationId: string,
  user: JwtPayload,
  payload: IMessage,
) => {
  const userId = new Types.ObjectId(user.user); // Extract the user ID from the JWT token
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Check if the conversation exists for the provided conversation ID and userId
    const conversation = await ConversationModel.findOne({
      _id: conversationId,
      users: { $in: [userId] },
    }).session(session); // Ensure session is used

    if (!conversation) {
      throw new AppError(
        HttpStatus.NOT_FOUND,
        "Conversation not found or user not authorized.",
      );
    }

    // Set the sender_id in the payload
    payload.sender_id = userId;
    payload.conversation_id = new Types.ObjectId(conversationId);

    const uploadedFiles: string[] = []; // Array to store the file URLs (secure_url)
    const uploadedFilesIds: string[] = []; // Array to store attachment model IDs
    const uploadedFileMimetypes: string[] = []; // Array to store mimetypes

    if (files) {
      for (const file of files as Express.Multer.File[]) {
        const uploadedFile = await sendFileToCloudinary(
          file.buffer,
          file.originalname,
          file.mimetype,
        );

        uploadedFiles.push(uploadedFile.secure_url);
        uploadedFileMimetypes.push(file.mimetype); // Store mimetype
      }
    }
    payload.attachment_id = [];

    const result = await Message.create([payload], { session });

    if (!result) {
      throw new AppError(HttpStatus.BAD_REQUEST, "Message failed to send");
    }

    // 2. Create the Attachment models based on the uploaded files
    for (let i = 0; i < uploadedFiles.length; i++) {
      const fileUrls = uploadedFiles[i];
      const mimetypes = uploadedFileMimetypes[i];
      const attachment = await AttachmentModel.create(
        [
          {
            conversation_id: conversation._id,
            message_id: result[0]._id, // Associate attachment with the created message
            fileUrl: fileUrls, // Store the Cloudinary URL of the uploaded file
            mimeType: mimetypes, // Store the mimetype of the file
          },
        ],
        { session }, // Ensure session is passed for atomicity
      );

      if (!attachment) {
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          "Attachment creation failed",
        );
      }

      // Push the attachment ID into the array
      uploadedFilesIds.push(attachment[0]._id.toString());
    }

    // 3. Update the message with the attachment IDs
    const updatedMessage = await Message.findByIdAndUpdate(
      result[0]._id,
      { attachment_id: uploadedFilesIds }, // Update the attachment_id field with the created attachment IDs
      { new: true, session },
    );

    if (!updatedMessage) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "Failed to update the message with attachment IDs",
      );
    }

    const updatedConversation = await ConversationModel.findByIdAndUpdate(
      conversation._id,
      { lastMsg: updatedMessage._id },
      { new: true, session },
    );

    if (!updatedConversation) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "Something went wrong during conversation update",
      );
    }

    // Commit the transaction and end session
    await session.commitTransaction();
    await session.endSession();

    // Return the result (updated message with attachment references)
    return updatedMessage;
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    throw new AppError(HttpStatus.BAD_REQUEST, error as any);
  }
};

export const attachmentServices = {
  sendMessageByAttachment,
};
