import express from "express";

import {
  createAdmin,
  adminLogin,
  updateUserBlockStatus,
  updateDonorBlockStatus,
} from "../controller/adminController.js";

import { authAdmin } from "../middleware/adminAuth.js";

const adminRouter = express.Router();

// ===============================
// ADMIN
// ===============================

adminRouter.post("/create-admin", createAdmin);

adminRouter.post("/admin-login", adminLogin);

// ===============================
// REGISTERED USER BLOCK / UNBLOCK
// ===============================

adminRouter.patch("/user/:id/block-status", authAdmin, updateUserBlockStatus);

// ===============================
// DONOR BLOCK / UNBLOCK
// ===============================

adminRouter.patch("/donor/:id/block-status", authAdmin, updateDonorBlockStatus);

export default adminRouter;
