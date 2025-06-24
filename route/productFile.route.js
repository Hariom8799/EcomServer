import express from "express";
import multer from "multer";
import {
  getProductFiles,
  getProductFileById,
  getProductFileByProductId,
  createProductFile,
  updateProductFile,
  deleteProductFile,
} from "../controllers/productFile.controller.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Routes
router.get("/", getProductFiles);
router.get("/:id", getProductFileById);
router.get("/product/:id", getProductFileByProductId);

router.post("/", upload.array("file"), createProductFile);

router.put("/:id", upload.array("file"), updateProductFile);

router.delete("/:id", deleteProductFile);

export default router;
