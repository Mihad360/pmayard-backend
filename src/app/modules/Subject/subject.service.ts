import HttpStatus from "http-status";
import AppError from "../../erros/AppError";
import { GradeModel } from "../Grade/grade.model";
import { ISubject } from "./subject.interface";
import { SubjectModel } from "./subject.model";
import QueryBuilder from "../../../builder/QueryBuilder";

const subjectSearch = ["name"];

const addSubject = async (id: string, payload: ISubject) => {
  const isGradeExist = await GradeModel.findById(id);
  if (!isGradeExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Grade not found");
  }
  payload.grade = isGradeExist._id;
  const result = await SubjectModel.create(payload);
  return result;
};

const getSubjects = async (id: string, query: Record<string, unknown>) => {
  const isGradeExist = await GradeModel.findById(id);
  if (!isGradeExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Grade not found");
  }
  const subjectQuery = new QueryBuilder(
    SubjectModel.find({ grade: isGradeExist._id, isDeleted: false }),
    query,
  )
    .search(subjectSearch)
    .filter()
    .fields()
    .paginate()
    .sort();

  const meta = await subjectQuery.countTotal();
  const result = await subjectQuery.modelQuery;
  return { meta, result };
};

const removeSubject = async (eventId: string) => {
  const isEventExist = await SubjectModel.findById(eventId);
  if (!isEventExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "subject not found");
  }
  const result = await SubjectModel.findByIdAndUpdate(
    isEventExist._id,
    {
      isDeleted: true,
    },
    { new: true },
  );
  return result;
};

export const subjectServices = {
  addSubject,
  getSubjects,
  removeSubject,
};
