import { Types } from "mongoose";
import { IUser } from "../User/user.interface";
import { IProfessional } from "../Professional/professional.interface";
import { IParent } from "../Parent/parent.interface";
import { IAttachment } from "../Attachment/attachment.interface";

export interface IMessage extends Document {
  conversation_id: Types.ObjectId;
  sender_id: IUser | Types.ObjectId;
  attachment_id?: IAttachment | Types.ObjectId[] | string[];
  message_text: string;
  last_msg: Types.ObjectId;
  is_read: boolean;
  message_type: "text" | "attachments" | "audio";
  isDeleted: boolean;
}

export interface IMessageWithPopulatedRole extends IMessage {
  sender_id: IUser & {
    roleId: IProfessional | IParent; // The sender's roleId can be populated with either a Professional, Parent, or User
  };
  attachment_id: IAttachment;
}

export interface IMessageWithAttachment extends IMessage {
  attachment_id?: IAttachment;
}
