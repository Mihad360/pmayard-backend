/* eslint-disable @typescript-eslint/no-explicit-any */
import HttpStatus from "http-status";
import mongoose, { Types } from "mongoose";
import { JwtPayload } from "../../interface/global";
import { IMessage } from "../Message/message.interface";
import { ConversationModel } from "../Conversation/conversation.model";
import AppError from "../../erros/AppError";
import { sendFileToCloudinary } from "../../utils/sendImageToCloudinary";
import { Message } from "../Message/message.model";
import { AttachmentModel } from "./attachment.model";
import { emitMessageData } from "../../utils/socket";

const sendMessageByAttachment = async (
  files: Express.Multer.File[],
  conversationId: string,
  user: JwtPayload,
  payload: IMessage,
) => {
  const userId = new Types.ObjectId(user.user);
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Check if the conversation exists
    const conversation = await ConversationModel.findOne({
      _id: conversationId,
      users: { $in: [userId] },
    }).session(session);

    if (!conversation) {
      throw new AppError(
        HttpStatus.NOT_FOUND,
        "Conversation not found or user not authorized.",
      );
    }

    // Set the sender_id in the payload
    payload.sender_id = userId;
    payload.conversation_id = new Types.ObjectId(conversationId);

    const uploadedFiles: string[] = []; // Array to store file URLs
    const uploadedFilesIds: string[] = []; // Array to store attachment model IDs
    const uploadedFileMimetypes: string[] = []; // Array to store mimetypes
    const uploadedFileNames: string[] = []; // Array to store original file names

    if (files) {
      for (const file of files as Express.Multer.File[]) {
        const uploadedFile = await sendFileToCloudinary(
          file.buffer,
          file.originalname,
          file.mimetype,
        );

        uploadedFiles.push(uploadedFile.secure_url);
        uploadedFileMimetypes.push(file.mimetype);
        uploadedFileNames.push(file.originalname); // Store original file name
      }
    }
    payload.attachment_id = [];

    const result = await Message.create([payload], { session });

    if (!result) {
      throw new AppError(HttpStatus.BAD_REQUEST, "Message failed to send");
    }

    // Create Attachment models for each uploaded file
    const attachmentsData = [];
    for (let i = 0; i < uploadedFiles.length; i++) {
      const attachment = await AttachmentModel.create(
        [
          {
            conversation_id: conversation._id,
            message_id: result[0]._id,
            fileUrl: uploadedFiles[i],
            mimeType: uploadedFileMimetypes[i],
            fileName: uploadedFileNames[i], // Store original file name
          },
        ],
        { session },
      );

      if (!attachment) {
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          "Attachment creation failed",
        );
      }

      uploadedFilesIds.push(attachment[0]._id.toString());
      attachmentsData.push({
        id: attachment[0]._id.toString(),
        fileUrl: uploadedFiles[i],
        mimeType: uploadedFileMimetypes[i],
        fileName: uploadedFileNames[i],
      });
    }

    // Update the message with the attachment IDs
    const updatedMessage = await Message.findByIdAndUpdate(
      result[0]._id,
      { attachment_id: uploadedFilesIds },
      { new: true, session },
    ).populate("attachment_id"); // Populate to get attachment details

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

    // Emit message data with all attachments
    emitMessageData({
      conversationId,
      senderId: userId.toString(),
      attachment: attachmentsData, // Send array of all attachments
      messageType: result[0].message_type,
    });

    return updatedMessage;
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    throw new AppError(HttpStatus.BAD_REQUEST, error as any);
  }
};

export const attachmentServices = {
  sendMessageByAttachment,
};
