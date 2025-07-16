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
        resource_type: 'raw'
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

// export const deleteImage = async (imageUrl) => {
//   try {
//     if (!imageUrl) {
//       throw new Error("No image URL provided");
//     }
//     console.log("Deleting image from Cloudinary:", imageUrl);
//     const urlParts = imageUrl.split("/");
//     const fileNameWithExtension = urlParts[urlParts.length - 1];
//     const publicId = fileNameWithExtension.split(".")[0];

//     // If the public_id includes folder structure, preserve it
//     const uploadIndex = urlParts.indexOf("upload");
//     if (uploadIndex !== -1 && uploadIndex < urlParts.length - 2) {
//       const folderPath = urlParts.slice(uploadIndex + 2, -1).join("/");
//       const fullPublicId = folderPath ? `${folderPath}/${publicId}` : publicId;

//       const result = await cloudinary.uploader.destroy(fullPublicId, {
//         resource_type: "raw",
//       });
//       console.log("Cloudinary delete result:", result);

//       if (result.result === "ok") {
//         return { success: true, message: "Image deleted successfully" };
//       } else {
//         throw new Error(`Failed to delete image: ${result.result}`);
//       }
//     } else {
//       // Fallback for simple public_id
//       const result = await cloudinary.uploader.destroy(publicId, {
//         resource_type: "raw",
//       });
//       console.log("Cloudinary delete result:", result);

//       if (result.result === "ok") {
//         return { success: true, message: "Image deleted successfully" };
//       } else {
//         throw new Error(`Failed to delete image: ${result.result}`);
//       }
//     }
//   } catch (error) {
//     console.error("Error deleting image from Cloudinary:", error);
//     return { success: false, error: error.message };
//   }
// };

const extractPublicIdFromUrl = (url) => {
  try {
    // Decode URL to handle encoded characters
    const decodedUrl = decodeURIComponent(url);

    // Split URL into parts
    const urlParts = decodedUrl.split("/");

    // Find the 'upload' part in the URL
    const uploadIndex = urlParts.findIndex((part) => part === "upload");

    if (uploadIndex === -1) {
      throw new Error("Invalid Cloudinary URL format");
    }

    // Get everything after 'upload' and version (if exists)
    let pathParts = urlParts.slice(uploadIndex + 1);

    // Remove version if it exists (starts with 'v' followed by numbers)
    if (pathParts.length > 0 && /^v\d+$/.test(pathParts[0])) {
      pathParts = pathParts.slice(1);
    }

    // Join all parts to get the full path
    const fullPath = pathParts.join("/");

    // For files with extensions, we need to remove the extension from the last part only
    const lastSlashIndex = fullPath.lastIndexOf("/");
    if (lastSlashIndex !== -1) {
      // Has folder structure
      const folderPath = fullPath.substring(0, lastSlashIndex);
      const fileName = fullPath.substring(lastSlashIndex + 1);
      const fileNameWithoutExt = removeExtension(fileName);
      return `${folderPath}/${fileNameWithoutExt}`;
    } else {
      // No folder structure, just filename
      return removeExtension(fullPath);
    }
  } catch (error) {
    console.error("Error extracting public_id:", error);
    return null;
  }
};

// Helper function to remove extension from filename
const removeExtension = (filename) => {
  const lastDotIndex = filename.lastIndexOf(".");
  if (lastDotIndex !== -1) {
    return filename.substring(0, lastDotIndex);
  }
  return filename;
};

// Alternative approach: More robust extraction with proper file extension handling
export const deleteImage = async (imageUrl) => {
  try {
    if (!imageUrl) {
      throw new Error("No image URL provided");
    }

    console.log("Deleting image from Cloudinary:", imageUrl);

    // Extract public_id using multiple methods
    let publicId = extractPublicIdFromUrl(imageUrl);

    if (!publicId) {
      console.log("URL extraction failed, trying regex method");
      // Method 2: Regex extraction as fallback
      const match = imageUrl.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
      if (match) {
        publicId = decodeURIComponent(match[1]);
      }
    }

    if (!publicId) {
      throw new Error("Could not extract public_id from URL");
    }

    console.log("Extracted public_id:", publicId);

    // Get the file extension from the original URL to determine resource type
    const fileExtension = getFileExtension(imageUrl);
    console.log("File extension:", fileExtension);

    // Determine resource types to try based on file extension
    const resourceTypes = getResourceTypesForExtension(fileExtension);

    let lastError = null;

    for (const resourceType of resourceTypes) {
      try {
        const result = await cloudinary.uploader.destroy(publicId, {
          resource_type: resourceType,
        });

        console.log(`Cloudinary delete result (${resourceType}):`, result);

        if (result.result === "ok") {
          return { success: true, message: "File deleted successfully" };
        }

        if (result.result === "not found") {
          lastError = `File not found with resource_type: ${resourceType}`;
          continue;
        }

        throw new Error(`Failed to delete file: ${result.result}`);
      } catch (error) {
        lastError = error.message;
        console.log(
          `Failed with resource_type ${resourceType}:`,
          error.message
        );
        continue;
      }
    }

    // Try with the original filename including extension as public_id
    console.log("Trying with original filename including extension...");
    const publicIdWithExtension = extractPublicIdWithExtension(imageUrl);

    if (publicIdWithExtension && publicIdWithExtension !== publicId) {
      console.log(
        "Trying with extension-included public_id:",
        publicIdWithExtension
      );

      for (const resourceType of resourceTypes) {
        try {
          const result = await cloudinary.uploader.destroy(
            publicIdWithExtension,
            {
              resource_type: resourceType,
            }
          );

          console.log(
            `Cloudinary delete result with extension (${resourceType}):`,
            result
          );

          if (result.result === "ok") {
            return { success: true, message: "File deleted successfully" };
          }
        } catch (error) {
          console.log(
            `Failed with extension method ${resourceType}:`,
            error.message
          );
          continue;
        }
      }
    }

    // If file is not found in any resource type, consider it as success
    console.log(
      "File not found in any resource type, considering as already deleted"
    );
    return {
      success: true,
      message: "File not found (possibly already deleted or never existed)",
      warning: lastError,
    };
  } catch (error) {
    console.error("Error deleting file from Cloudinary:", error);
    return { success: false, error: error.message };
  }
};

// Helper function to get file extension
const getFileExtension = (url) => {
  const decodedUrl = decodeURIComponent(url);
  const lastDotIndex = decodedUrl.lastIndexOf(".");
  const lastSlashIndex = decodedUrl.lastIndexOf("/");

  if (lastDotIndex > lastSlashIndex && lastDotIndex !== -1) {
    return decodedUrl.substring(lastDotIndex + 1).toLowerCase();
  }

  return null;
};

// Helper function to determine resource types based on file extension
const getResourceTypesForExtension = (extension) => {
  if (!extension) {
    return ["raw", "image", "video"]; // Try all if no extension
  }

  const imageExtensions = [
    "jpg",
    "jpeg",
    "png",
    "gif",
    "bmp",
    "webp",
    "svg",
    "ico",
    "tiff",
    "tif",
  ];
  const videoExtensions = [
    "mp4",
    "avi",
    "mov",
    "wmv",
    "flv",
    "webm",
    "mkv",
    "3gp",
    "ogv",
  ];
  const rawExtensions = [
    "txt",
    "pdf",
    "doc",
    "docx",
    "xls",
    "xlsx",
    "ppt",
    "pptx",
    "zip",
    "rar",
    "cad",
    "dwg",
    "dxf",
    "skp",
    "tekla",
    "xml",
    "json",
    "csv",
    "rtf",
  ];

  if (imageExtensions.includes(extension)) {
    return ["image", "raw"]; // Try image first, then raw
  } else if (videoExtensions.includes(extension)) {
    return ["video", "raw"]; // Try video first, then raw
  } else if (rawExtensions.includes(extension)) {
    return ["raw"]; // Only try raw for document/data files
  } else {
    return ["raw", "image", "video"]; // Unknown extension, try all
  }
};

// Helper function to extract public_id with extension
const extractPublicIdWithExtension = (url) => {
  try {
    const decodedUrl = decodeURIComponent(url);
    const urlParts = decodedUrl.split("/");
    const uploadIndex = urlParts.findIndex((part) => part === "upload");

    if (uploadIndex === -1) {
      return null;
    }

    let pathParts = urlParts.slice(uploadIndex + 1);

    // Remove version if it exists
    if (pathParts.length > 0 && /^v\d+$/.test(pathParts[0])) {
      pathParts = pathParts.slice(1);
    }

    // Return the full path including extension
    return pathParts.join("/");
  } catch (error) {
    console.error("Error extracting public_id with extension:", error);
    return null;
  }
};