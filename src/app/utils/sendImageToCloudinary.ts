/* eslint-disable @typescript-eslint/no-unsafe-function-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import config from "../config";
import multer, { StorageEngine } from "multer";
import path from "path";

// Cloudinary config
cloudinary.config({
  cloud_name: config.cloudinary_name,
  api_key: config.cloudinary_api_key,
  api_secret: config.cloudinary_api_secret,
});

// Function to upload files (image, PDF, Word)
export const sendFileToCloudinary = (
  fileBuffer: Buffer,
  fileName: string,
  mimetype: string,
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    if (!fileBuffer) return reject(new Error("Missing file buffer"));
    if (!mimetype) return reject(new Error("Missing mimetype"));

    // Strip extension from the file name
    const nameWithoutExt = path.parse(fileName).name;

    if (mimetype.startsWith("image/")) {
      if (Buffer.isBuffer(fileBuffer)) {
        const base64Image = fileBuffer.toString("base64"); // Buffer to base64
        const dataUri = `data:${mimetype};base64,${base64Image}`;

        // Upload image to Cloudinary
        cloudinary.uploader.upload(
          dataUri,
          {
            public_id: nameWithoutExt,
            resource_type: "image",
            type: "upload",
          },
          (error, result) => {
            if (error) return reject(error);
            if (!result) return reject(new Error("No result from Cloudinary"));
            resolve(result);
          },
        );
      } else {
        reject(new Error("Expected a buffer for image upload"));
      }
    }
    // Handle PDF and Word files (raw files)
    else if (
      mimetype === "application/pdf" ||
      mimetype === "application/msword" ||
      mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      if (Buffer.isBuffer(fileBuffer)) {
        // Use upload_stream for raw files (accepts Buffer)
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            public_id: fileName,
            resource_type: "raw",
            type: "upload",
          },
          (error, result) => {
            if (error) return reject(error);
            if (!result) return reject(new Error("No result from Cloudinary"));
            resolve(result);
          },
        );

        // Write the buffer to the upload stream
        uploadStream.end(fileBuffer);
      } else {
        reject(new Error("Expected a buffer for PDF/Word upload"));
      }
    } else {
      reject(new Error("Unsupported file type"));
    }
  });
};

// Multer memory storage
const storage: StorageEngine = multer.memoryStorage();

// Filter function to allow only images, PDFs, and Word files
// const fileFilter = (req: any, file: Express.Multer.File, cb: Function) => {
//   const allowedMimeTypes = [
//     "image/jpeg",
//     "image/png",
//     "image/gif",
//     "application/pdf",
//     "application/msword",
//     "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
//   ];

//   if (!allowedMimeTypes.includes(file.mimetype)) {
//     cb(
//       new Error(
//         "Invalid file type. Only images, PDFs, and Word documents are allowed.",
//       ),
//       false,
//     );
//   } else {
//     cb(null, true);
//   }
// };

// Multer upload configuration
export const upload = multer({
  storage,
  // fileFilter,
});
