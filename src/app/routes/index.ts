import { Router } from "express";
import { userRoutes } from "../modules/User/user.routes";
import { AuthRoutes } from "../modules/Auth/auth.route";
import { ProfessionalRoutes } from "../modules/Professional/professional.route";
import { ParentRoutes } from "../modules/Parent/parent.route";
import { AdminRoutes } from "../modules/Admin/admin.route";
import { SessionRoutes } from "../modules/Session/session.route";

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
];

moduleRoutes.forEach((route) => router.use(route.path, route?.route));

// router.use("/students", StudentRoutes);
// router.use("/users", UserRoutes);

export default router;
