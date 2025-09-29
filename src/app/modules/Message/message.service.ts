import HttpStatus from "http-status";
import AppError from "../../erros/AppError";
import { ChatModel } from "../Chat/chat.model";
import { IMessage } from "./message.interface";
import { Message } from "./message.model";

const sendMessage = async (
  payload: IMessage,
  userId: string,
  chatId: string,
) => {
  const message = new Message({
    ...payload,
    chat_id: chatId,
    sender_id: userId,
  });

  await message.save();
  return message;
};

const getMyMessages = async (userId: string, chatId: string) => {
  const isChatExist = await ChatModel.findOne({
    _id: chatId,
    users: { $in: [userId] },
  });
  if (!isChatExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "something went wrong");
  }
  const messages = await Message.find({
    chat_id: isChatExist._id,
  });
  return messages;
};

export const messageServices = {
  sendMessage,
  getMyMessages,
};
