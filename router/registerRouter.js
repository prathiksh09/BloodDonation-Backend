import express from "express";

import { registerDonor, useLogin1 } from "../controller/registerController.js";
import { validateRegister } from "../middleware/validater.js";
import { rateLimitation } from "../middleware/rateLimite.js";

const router = express.Router();
router.post("/registerDonor", validateRegister, registerDonor);
router.post("/useLogin1", rateLimitation, useLogin1);

export default router;
