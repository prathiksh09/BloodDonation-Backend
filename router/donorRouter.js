import express from "express";

import {
  createDonor,
  getAllDonor,
  getMyDonorDetails,
  deleteDonor,
} from "../controller/donorController.js";

import { authDonor } from "../middleware/donorAuth.js";
import { upload } from "../config/multer.js";

const router = express.Router();

router.post("/create-donor", upload.single("image"), authDonor, createDonor);

router.get("/get-all-donors", getAllDonor);

router.get("/mydonor-details", authDonor, getMyDonorDetails);

router.delete("/delete-donor/:id", deleteDonor);

export default router;
