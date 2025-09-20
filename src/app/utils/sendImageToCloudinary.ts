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

// Upload to Cloudinary (buffer to base64)
export const sendImageToCloudinary = (
  // eslint-disable-next-line no-undef
  fileBuffer: Buffer,
  imageName: string,
  mimetype: string,
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    if (!fileBuffer) return reject(new Error("Missing file buffer"));
    if (!mimetype) return reject(new Error("Missing mimetype"));

    // Strip extension from the file name
    const nameWithoutExt = path.parse(imageName).name;

    // Convert to base64
    const base64Image = fileBuffer.toString("base64");
    const dataUri = `data:${mimetype};base64,${base64Image}`;

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
  });
};

// Multer memory storage
const storage: StorageEngine = multer.memoryStorage();
export const upload = multer({ storage });



// import HttpStatus from "http-status";
// import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
// import config from "../config";
// import multer, { StorageEngine } from "multer";
// import AppError from "../erros/AppError";

// // Cloudinary config
// cloudinary.config({
//   cloud_name: config.cloudinary_name,
//   api_key: config.cloudinary_api_key,
//   api_secret: config.cloudinary_api_secret,
// });

// // Upload to Cloudinary (buffer to base64)
// export const sendImageToCloudinary = (
//   fileBuffer: Buffer,
//   imageName: string,
//   mimetype: string,
// ): Promise<UploadApiResponse> => {
//   return new Promise((resolve, reject) => {
//     if (!fileBuffer)
//       throw new AppError(HttpStatus.NOT_FOUND, "Missing file buffer");
//     if (!mimetype) throw new AppError(HttpStatus.NOT_FOUND, "Missing mimetype");

//     // Convert to base64
//     const base64Image = fileBuffer.toString("base64");
//     const dataUri = `data:${mimetype};base64,${base64Image}`;

//     cloudinary.uploader.upload(
//       dataUri,
//       {
//         public_id: imageName,
//         resource_type: "image",
//         type: "upload",
//       },
//       (error, result) => {
//         if (error) return reject(error);
//         if (!result) return reject(new Error("No result from Cloudinary"));
//         resolve(result);
//       },
//     );
//   });
// };

// // Multer memory storage
// const storage: StorageEngine = multer.memoryStorage();
// export const upload = multer({ storage });
