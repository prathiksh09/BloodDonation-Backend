import express from "express";

import {
  createService,
  getUserRequest,
  getDonorRequests,
  getrequestId,
  updateServiceStatus,
  completeService,
  getMyDonations,
} from "../controller/serviceController.js";

import { authUser } from "../middleware/userAuth.js";
import { authDonor } from "../middleware/donorAuth.js";

const router = express.Router();

router.post("/create-service", authUser, createService);

// Get all blood requests created by the logged-in user
router.get("/getUserRequest", authUser, getUserRequest);

// Get single blood request details by ID
router.get("/get-requestId/:id", authUser, getrequestId);

// User marks an accepted request as completed (Status: 'completed')
router.patch("/:id/complete", authUser, completeService);

router.get("/donor-requests", authDonor, getDonorRequests);
// donar accept or reject  the requests
router.patch("/:id/status", authDonor, updateServiceStatus);

router.get("/my-donations", authDonor, getMyDonations);

export default router;
