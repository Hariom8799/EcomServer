import { deleteImage } from "../utils/ImageUpload.js";

export const deleteImageController = async (req, res) => {
  try {
    // Check both fileUrl and imageUrl for backward compatibility
    const { fileUrl, imageUrl } = req.body;
    const urlToDelete = fileUrl || imageUrl;

    // Validate that URL is provided
    if (!urlToDelete) {
      return res.status(400).json({
        success: false,
        message: "File URL is required",
      });
    }

    // Call the deleteImage utility function
    const result = await deleteImage(urlToDelete);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.error || "Failed to delete file",
      });
    }
  } catch (error) {
    console.error("Error in deleteImageController:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting file",
      error: error.message,
    });
  }
};
