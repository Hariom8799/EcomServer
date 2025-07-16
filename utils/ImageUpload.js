// utils/ImageUpload.js
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.cloudinary_Config_Cloud_Name,
  api_key: process.env.cloudinary_Config_api_key,
  api_secret: process.env.cloudinary_Config_api_secret,
  secure: true,
});


// export async function uploadFiles(request) {
//   try {
//     const imageFiles = request.files; // files uploaded via multer
//     const { fileNames = [], folderNames = [] } = request.body; // form fields
//     const uploadedFiles = [];

//     for (let i = 0; i < imageFiles.length; i++) {
//       const file = imageFiles[i];
//       const fileName = Array.isArray(fileNames) ? fileNames[i] : fileNames;
//       const folderName = Array.isArray(folderNames)
//         ? folderNames[i]
//         : folderNames;

//       const cloudinaryOptions = {
//         folder: folderName ? `ProductFile/${folderName}` : "ProductFile",
//         use_filename: true,
//         unique_filename: false,
//         public_id: fileName ? fileName.split(".")[0] : undefined,
//       };

//       const result = await cloudinary.uploader.upload(
//         file.path,
//         cloudinaryOptions
//       );

//       uploadedFiles.push({
//         fileUrl: result.secure_url,
//         fileName: fileName || file.originalname,
//         folderName: folderName || "",
//       });

//       fs.unlinkSync(file.path); // clean up
//     }

//     return { success: true, images: uploadedFiles }; // now images include metadata
//   } catch (error) {
//     return { success: false, error: error.message };
//   }
// }

// export async function uploadFiles(request) {
//   try {
//     const filesArray = [];
//     const files = request.files;

//     if (!files || files.length === 0) {
//       return { success: true, images: [] };
//     }

//     // Extract arrays from form data
//     const fileNames = Array.isArray(request.body.fileNames)
//       ? request.body.fileNames
//       : [request.body.fileNames];
//     const folderNames = Array.isArray(request.body.folderNames)
//       ? request.body.folderNames
//       : [request.body.folderNames];
//     const uploadedByArray = Array.isArray(request.body.uploadedBy)
//       ? request.body.uploadedBy
//       : [request.body.uploadedBy];
//     const uploadedAtArray = Array.isArray(request.body.uploadedAt)
//       ? request.body.uploadedAt
//       : [request.body.uploadedAt];
//     const fileVersionArray = Array.isArray(request.body.fileVersion)
//       ? request.body.fileVersion
//       : [request.body.fileVersion];

//     for (let i = 0; i < files.length; i++) {
//       const file = files[i];
//       const fileName = Array.isArray(fileNames) ? fileNames[i] : fileNames;
//             const folderName = Array.isArray(folderNames)
//               ? folderNames[i]
//               : folderNames;

//       const cloudinaryOptions = {
//         folder: folderName ? `ProductFile/${folderName}` : "ProductFile",
//         use_filename: true,
//         unique_filename: false,
//         public_id: fileName ? fileName.split(".")[0] : undefined,
//       };

//       // Your existing file upload logic (Cloudinary/S3)
//       const uploadResult = await cloudinary.uploader.upload(
//         file.path,
//         cloudinaryOptions
//       );

//       // if (uploadResult.success) {
//       filesArray.push({
//         fileUrl: uploadResult.secure_url,
//         fileName: fileNames[i] || file.originalname,
//         folderName: folderNames[i] || "default",
//         uploadedBy: uploadedByArray[i] || null,
//         uploadedAt: uploadedAtArray[i] || new Date().toISOString(),
//         fileVersion: parseInt(fileVersionArray[i]) || 1,
//       });
//       fs.unlinkSync(file.path);
//       // }
//     }

//     return { success: true, images: filesArray };
//   } catch (error) {
//     // fs.unlinkSync(file.path);
//     console.log("error in the file upload ", error)
//     return { success: false, error: error.message };
//   }
// }

export async function uploadFiles(request) {
  try {
    const filesArray = [];
    const files = request.files;

    if (!files || files.length === 0) {
      return { success: true, images: [] };
    }

    // Extract arrays from form data
    const fileNames = Array.isArray(request.body.fileNames)
      ? request.body.fileNames
      : [request.body.fileNames];
    const folderNames = Array.isArray(request.body.folderNames)
      ? request.body.folderNames
      : [request.body.folderNames];
    const uploadedByArray = Array.isArray(request.body.uploadedBy)
      ? request.body.uploadedBy
      : [request.body.uploadedBy];
    const uploadedAtArray = Array.isArray(request.body.uploadedAt)
      ? request.body.uploadedAt
      : [request.body.uploadedAt];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileName = Array.isArray(fileNames) ? fileNames[i] : fileNames;
      const folderName = Array.isArray(folderNames)
        ? folderNames[i]
        : folderNames;

      const cloudinaryOptions = {
        folder: folderName ? `ProductFile/${folderName}` : "ProductFile",
        use_filename: true,
        unique_filename: false,
        public_id: fileName ? fileName.split(".")[0] : undefined,
      };

      // Your existing file upload logic (Cloudinary/S3)
      const uploadResult = await cloudinary.uploader.upload(
        file.path,
        cloudinaryOptions
      );

      filesArray.push({
        fileUrl: uploadResult.secure_url,
        fileName: fileNames[i] || file.originalname,
        folderName: folderNames[i] || "default",
        uploadedBy: uploadedByArray[i] || null,
        uploadedAt: uploadedAtArray[i] || new Date().toISOString(),
        fileVersion: 1, // Default version, will be calculated in uploadOrderFiles
      });

      fs.unlinkSync(file.path);
    }

    return { success: true, images: filesArray };
  } catch (error) {
    console.log("error in the file upload ", error);
    return { success: false, error: error.message };
  }
}

export const deleteImage = async (imageUrl) => {
  try {
    if (!imageUrl) {
      throw new Error("No image URL provided");
    }
    const urlParts = imageUrl.split("/");
    const fileNameWithExtension = urlParts[urlParts.length - 1];
    const publicId = fileNameWithExtension.split(".")[0];

    // If the public_id includes folder structure, preserve it
    const uploadIndex = urlParts.indexOf("upload");
    if (uploadIndex !== -1 && uploadIndex < urlParts.length - 2) {
      const folderPath = urlParts.slice(uploadIndex + 2, -1).join("/");
      const fullPublicId = folderPath ? `${folderPath}/${publicId}` : publicId;

      const result = await cloudinary.uploader.destroy(fullPublicId);
      console.log("Cloudinary delete result:", result);

      if (result.result === "ok") {
        return { success: true, message: "Image deleted successfully" };
      } else {
        throw new Error(`Failed to delete image: ${result.result}`);
      }
    } else {
      // Fallback for simple public_id
      const result = await cloudinary.uploader.destroy(publicId);
      console.log("Cloudinary delete result:", result);

      if (result.result === "ok") {
        return { success: true, message: "Image deleted successfully" };
      } else {
        throw new Error(`Failed to delete image: ${result.result}`);
      }
    }
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error);
    return { success: false, error: error.message };
  }
};
