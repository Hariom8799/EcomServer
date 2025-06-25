import ProductFileModel from "../models/ProductFile.js";
import {deleteImage,uploadFiles} from "../utils/ImageUpload.js"

export const getProductFiles = async (req, res)=>{
    try{
        const productFiles = await ProductFileModel.find({}).populate("product").populate("users");
        return res.status(200).json({
            message: "Product files fetched successfully",
            data: productFiles,
            success: true,
            error: false,
        });
    }
    catch(error){
        return response.status(500).json({
          message: error.message || error,
          error: true,
          success: false,
        });
    }
}

export const getProductFileById = async (req,res)=>{
    try {
        const {id} = req.params;
        const productFile = await ProductFileModel.findOne({_id : id})
          .populate("product")
          .populate("users");
        
        if(!productFile || productFile.length === 0) {
          return res.status(404).json({
            message: "Product file not found",
            success: false,
            error: true,
          });
        }

        return res.status(200).json({
          message: "Product file fetched successfully",
          data: productFile,
          success: true,
          error: false,
        });

    } catch (error) {
      return response.status(500).json({
        message: error.message || error,
        error: true,
        success: false,
      });
    }
}

export const getProductFileByProductId = async (req, res) => {
    try {
        const {id} = req.params;
        const productFile = await ProductFileModel.findOne({product : id})
          .populate("product")
          .populate("users");

        if(!productFile || productFile.length === 0) {
          return res.status(404).json({
            message: "Product file not found",
            success: false,
            error: true,
          });
        }

        return res.status(200).json({
          message: "Product file fetched successfully",
          data: productFile,
          success: true,
          error: false,
        });
    } catch (error) {
      return response.status(500).json({
        message: error.message || error,
        error: true,
        success: false,
      });
    }
}

export const createProductFile = async (req, res) => {
  try {
    const { product, users } = req.body;
    const uploadResult = await uploadFiles(req);
    if (!uploadResult.success) {
      return res
        .status(500)
        .json({ message: uploadResult.error, success: false, error: true });
    }

    const files = uploadResult.images; // Already an array of URLs (strings)

    const created = await ProductFileModel.create({
      product,
      users,
      fileUrls: files,
    });

    return res
      .status(201)
      .json({ message: "Created", data: created, success: true, error: false });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message || error, error: true, success: false });
  }
};

export const updateProductFile = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await ProductFileModel.findById(id);
    if (!existing) {
      return res.status(404).json({ message: "Not found", success: false, error: true });
    }

    // Upload new files (if any)
    const uploadResult = await uploadFiles(req);
    if (!uploadResult.success) {
      return res.status(500).json({ message: uploadResult.error, success: false, error: true });
    }

    const newFiles = uploadResult.images;

    // Only replace files if new ones were uploaded
    if (newFiles.length > 0) {
      // delete old images first
      if (existing.fileUrls && existing.fileUrls.length > 0) {
        await Promise.all(existing.fileUrls.map((f) => deleteImage(f.url)));
      }
      existing.fileUrls = newFiles;
    }

    if (req.body.product) existing.product = req.body.product;
    if (req.body.users) existing.users = req.body.users;

    await existing.save();

    return res.status(200).json({
      message: "Updated",
      data: existing,
      success: true,
      error: false,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
};


export const deleteProductFile = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await ProductFileModel.findById(id);
    if (!existing)
      return res
        .status(404)
        .json({ message: "Not found", success: false, error: true });

    if (existing.fileUrls && existing.fileUrls.length > 0) {
      await Promise.all(existing.fileUrls.map((f) => deleteImage(f.url)));
    }
    if (existing) await existing.deleteOne();
    return res
      .status(200)
      .json({ message: "Deleted", success: true, error: false });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message || error, error: true, success: false });
  }
};