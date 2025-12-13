/* eslint-disable @typescript-eslint/no-unused-vars */
import express, { Application, Request, Response } from "express";
import cors from "cors";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";
import notFound from "./app/middlewares/notFound";
import router from "./app/routes";
import cookieParser from "cookie-parser";
const app: Application = express();

app.use(express.json());
app.use(
  cors({
    origin: "*",
    credentials: true,
  }),
);
app.use(cookieParser());

app.use("/api/v1", router);

const test = async (req: Request, res: Response) => {
  const a = 10;
  res.send(a);
};

app.get("/", test);

app.use(globalErrorHandler);
app.use(notFound);

export default app;
