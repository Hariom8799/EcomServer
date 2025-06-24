// utils/ImageUpload.js
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.cloudinary_Config_Cloud_Name,
  api_key: process.env.cloudinary_Config_api_key,
  api_secret: process.env.cloudinary_Config_api_secret,
  secure: true,
});

export async function uploadImages(request) {
  try {
    const image = request.files;
    const imagesArr = [];

    const options = {
      folder: "ProductFile",
      use_filename: true,
      unique_filename: false,
    };

    for (let i = 0; i < image?.length; i++) {
      const result = await cloudinary.uploader.upload(image[i].path, options);
      imagesArr.push(result.secure_url);
      fs.unlinkSync(image[i].path); // clean up local file
    }

    return { success: true, images: imagesArr };
  } catch (error) {
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
