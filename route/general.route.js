import express from "express";
import { deleteImageController } from "../controllers/general.controller.js"; // adjust path as needed

const router = express.Router();

// DELETE route for deleting images
router.delete("/delete-file", deleteImageController);

export default router;
