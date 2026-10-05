import express from "express";

import {
  createFeedback,
  getDonorFeedback,
  getUserFeedback,
  checkFeedback,
} from "../controller/feedbackController.js";

import { authUser } from "../middleware/userAuth.js";
import { authDonor } from "../middleware/donorAuth.js";

const router = express.Router();

// User
router.post("/createFeedback", authUser, createFeedback);

router.get("/getUserFeedback/:requestId", authUser, getUserFeedback);

router.get("/checkFeedback/:requestId", authUser, checkFeedback);

// Donor
router.get("/getDonorFeedback", authDonor, getDonorFeedback);

export default router;
