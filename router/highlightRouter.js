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
import { upload } from "../config/multer.js";

const highlightRouter = express.Router();

highlightRouter.get("/active", getActiveHighlights);

highlightRouter.post(
  "/create",
  authAdmin,
  upload.single("image"),
  createHighlight,
);

highlightRouter.get("/all", authAdmin, getAllHighlights);

highlightRouter.get("/bin", authAdmin, getDeletedHighlights);

highlightRouter.get("/:id", authAdmin, getHighlightById);

highlightRouter.put("/:id", authAdmin, upload.single("image"), updateHighlight);

highlightRouter.delete("/:id/permanent", authAdmin, permanentlyDeleteHighlight);

highlightRouter.delete("/:id", authAdmin, deleteHighlight);

highlightRouter.patch("/:id/restore", authAdmin, restoreHighlight);

highlightRouter.patch("/:id/toggle", authAdmin, toggleHighlightStatus);

export default highlightRouter;
