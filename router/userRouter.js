import express from "express";

import {
  createUser,
  useLogin,
  getAllUsers,
  checkUserStatus,
} from "../controller/userController.js";

import { upload } from "../config/multer.js";

import { authUser } from "../middleware/userAuth.js";

const router = express.Router();

//for creating user and login
router.post("/create-user", upload.single("image"), createUser);

router.post("/useLogin", useLogin);

// to get all user to admin in admindashboard

router.get("/get-all-users", getAllUsers);

// to check logged in user status

router.get("/check-user-status", authUser, checkUserStatus);

export default router;
