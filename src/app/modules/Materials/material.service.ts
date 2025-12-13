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
  files: Express.Multer.File[], // Expecting an array of files
) => {
  const isSubjectExist = await SubjectModel.findById(subjectId);
  if (!isSubjectExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Subject not found");
  }
  if (!files || files.length === 0) {
    throw new AppError(HttpStatus.NOT_FOUND, "No files found");
  }

  // Loop through each file and upload to Cloudinary
  const materials = await Promise.all(
    files.map(async (file) => {
      const result = await sendFileToCloudinary(
        file.buffer,
        file.originalname,
        file.mimetype,
      );
      if (!result) {
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          "Something went wrong during file upload",
        );
      }

      // Create a new payload for each file
      const materialPayload = {
        ...payload,
        fileUrl: result.secure_url,
        mimeType: file.mimetype,
        subjectId: isSubjectExist._id,
      };

      // Create a new material in the database for each file
      const material = await MaterialModel.create(materialPayload);
      return material;
    }),
  );

  return materials;
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

const removeMaterial = async (eventId: string) => {
  const isEventExist = await MaterialModel.findById(eventId);
  if (!isEventExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "material not found");
  }
  const result = await MaterialModel.findByIdAndUpdate(
    isEventExist._id,
    {
      isDeleted: true,
    },
    { new: true },
  );
  return result;
};

export const materialServices = {
  addMaterial,
  getMaterials,
  removeMaterial,
};
