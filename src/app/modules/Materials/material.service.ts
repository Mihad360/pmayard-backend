import HttpStatus from "http-status";
import AppError from "../../erros/AppError";
import { SubjectModel } from "../Subject/subject.model";
import { IMaterial } from "./material.interface";
import { sendFileToCloudinary } from "../../utils/sendImageToCloudinary";
import { MaterialModel } from "./material.model";
import QueryBuilder from "../../../builder/QueryBuilder";

const materialSearch = ["title", "mimeType"];

const addMaterial = async (
  subjectId: string,
  payload: IMaterial,
  file: Express.Multer.File,
) => {
  const isSubjectExist = await SubjectModel.findById(subjectId);
  if (!isSubjectExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Subject not found");
  }
  if (!file) {
    throw new AppError(HttpStatus.NOT_FOUND, "The file is not found");
  }
  const result = await sendFileToCloudinary(
    file.buffer,
    file.originalname,
    file.mimetype,
  );
  if (result) {
    payload.fileUrl = result.secure_url;
    payload.mimeType = file.mimetype;
    payload.subjectId = isSubjectExist._id;
    const material = await MaterialModel.create(payload);
    return material;
  } else {
    throw new AppError(HttpStatus.BAD_REQUEST, "Something went wrong");
  }
};

const getMaterials = async (
  subjectId: string,
  query: Record<string, unknown>,
) => {
  const isSubjectExist = await SubjectModel.findById(subjectId);
  if (!isSubjectExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Subject not found");
  }
  const materialQuery = new QueryBuilder(
    MaterialModel.find({ subjectId: isSubjectExist._id, isDeleted: false }),
    query,
  )
    .search(materialSearch)
    .filter()
    .fields()
    .paginate()
    .sort();

  const meta = await materialQuery.countTotal();
  const result = await materialQuery.modelQuery;
  return { meta, result };
};

export const materialServices = {
  addMaterial,
  getMaterials,
};
