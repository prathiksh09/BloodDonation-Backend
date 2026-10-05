import express from "express";

import {
  createHighlight,
  getActiveHighlights,
  getAllHighlights,
  getDeletedHighlights,
  getHighlightById,
  updateHighlight,
  deleteHighlight,
  restoreHighlight,
  permanentlyDeleteHighlight,
  toggleHighlightStatus,
} from "../controller/highlightController.js";

import { authAdmin } from "../middleware/adminAuth.js";

// NEW - multer
import { upload } from "../config/multer.js";

const highlightRouter = express.Router();

// Get active highlights
highlightRouter.get("/active", getActiveHighlights);

// Create highlight
highlightRouter.post(
  "/create",
  authAdmin,
  upload.single("image"),
  createHighlight,
);

// Get all normal highlights
highlightRouter.get("/all", authAdmin, getAllHighlights);

// Get deleted highlights / Bin
highlightRouter.get("/bin", authAdmin, getDeletedHighlights);

// Get single highlight
highlightRouter.get("/:id", authAdmin, getHighlightById);

// Update highlight
highlightRouter.put("/:id", authAdmin, upload.single("image"), updateHighlight);

// Move highlight to Bin
highlightRouter.delete("/:id", authAdmin, deleteHighlight);

// Restore highlight from Bin
highlightRouter.patch("/:id/restore", authAdmin, restoreHighlight);

highlightRouter.delete("/:id/permanent", authAdmin, permanentlyDeleteHighlight);

highlightRouter.patch("/:id/toggle", authAdmin, toggleHighlightStatus);

export default highlightRouter;
