import { Router } from "express";
import { userRoutes } from "../modules/User/user.routes";
import { AuthRoutes } from "../modules/Auth/auth.route";
import { ProfessionalRoutes } from "../modules/Professional/professional.route";
import { ParentRoutes } from "../modules/Parent/parent.route";
import { AdminRoutes } from "../modules/Admin/admin.route";
import { SessionRoutes } from "../modules/Session/session.route";
import { GradeRoutes } from "../modules/Grade/grade.route";
import { SubjectRoutes } from "../modules/Subject/subject.route";
import { MaterialRoutes } from "../modules/Materials/material.route";
import { EventRoutes } from "../modules/Event/event.route";
import { MessageRoutes } from "../modules/Message/message.route";
import { NotificationRoutes } from "../modules/Notification/notification.route";
import { RuleRoutes } from "../modules/Rules/rule.route";
import { AttachmentRoutes } from "../modules/Attachment/attachment.route";
import { ConversationRoutes } from "../modules/Conversation/conversation.route";

const router = Router();

const moduleRoutes = [
  {
    path: "/users",
    route: userRoutes,
  },
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/professionals",
    route: ProfessionalRoutes,
  },
  {
    path: "/parents",
    route: ParentRoutes,
  },
  {
    path: "/admin",
    route: AdminRoutes,
  },
  {
    path: "/sessions",
    route: SessionRoutes,
  },
  {
    path: "/grades",
    route: GradeRoutes,
  },
  {
    path: "/subjects",
    route: SubjectRoutes,
  },
  {
    path: "/materials",
    route: MaterialRoutes,
  },
  {
    path: "/events",
    route: EventRoutes,
  },
  {
    path: "/messages",
    route: MessageRoutes,
  },
  {
    path: "/notifications",
    route: NotificationRoutes,
  },
  {
    path: "/rules",
    route: RuleRoutes,
  },
  {
    path: "/attachments",
    route: AttachmentRoutes,
  },
  {
    path: "/conversations",
    route: ConversationRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route?.route));

// router.use("/students", StudentRoutes);
// router.use("/users", UserRoutes);

export default router;
