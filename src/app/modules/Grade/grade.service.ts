import HttpStatus from "http-status";
import QueryBuilder from "../../../builder/QueryBuilder";
import AppError from "../../erros/AppError";
import { IGrade } from "./grade.interface";
import { GradeModel } from "./grade.model";

const gradeSearch = ["name"];

const addGrade = async (payload: IGrade) => {
  const result = await GradeModel.create(payload);
  return result;
};

const getGrades = async (query: Record<string, unknown>) => {
  const gradeQuery = new QueryBuilder(
    GradeModel.find({ isDeleted: false }),
    query,
  )
    .search(gradeSearch)
    .filter()
    .fields()
    .paginate()
    .sort();

  const meta = await gradeQuery.countTotal();
  const result = await gradeQuery.modelQuery;
  return { meta, result };
};

const removeGrade = async (eventId: string) => {
  const isEventExist = await GradeModel.findById(eventId);
  if (!isEventExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "grade not found");
  }
  const result = await GradeModel.findByIdAndUpdate(
    isEventExist._id,
    {
      isDeleted: true,
    },
    { new: true },
  );
  return result;
};

export const gradeServices = {
  addGrade,
  getGrades,
  removeGrade,
};
