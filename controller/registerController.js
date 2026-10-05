import registerModel from "../model/registerModel.js";
import donorModel from "../model/donorModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const SECRET_KEY = "website";

// ==========================================================
// DONOR REGISTER
// ==========================================================
export const registerDonor = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check existing email
    const checkEmail = await registerModel.findOne({ email });

    if (checkEmail) {
      return res.json({
        success: false,
        message: "Donor with this email already exists",
      });
    }

    // Hash password
    const hashPassword = await bcrypt.hash(password, 10);

    // Create donor registered account
    const storeDonor = await registerModel.create({
      name,
      email,
      password: hashPassword,
    });

    if (!storeDonor) {
      return res.json({
        success: false,
        message: "Donor not created",
      });
    }

    // Create donor token
    const token = jwt.sign(
      {
        id: storeDonor._id,
      },
      SECRET_KEY
    );

    return res.json({
      success: true,
      message: "Donor registered successfully",
      token: token,
    });
  } catch (error) {
    console.log("Donor registration error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================================
// DONOR LOGIN
// ==========================================================
export const useLogin1 = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ======================================================
    // CHECK EMAIL
    // ======================================================

    const checkEmail = await registerModel.findOne({ email });

    if (!checkEmail) {
      return res.status(404).json({
        success: false,
        message: "Donor not registered",
      });
    }

    // ======================================================
    // CHECK PASSWORD
    // ======================================================

    const comparePassword = await bcrypt.compare(
      password,
      checkEmail.password
    );

    if (!comparePassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // ======================================================
    // CHECK WHETHER ADMIN BLOCKED THIS DONOR
    // ======================================================

    const donor = await donorModel.findOne({
      registerDonorId: checkEmail._id,
    });

    // If donor profile exists, check block status
    if (donor && donor.isBlocked === true) {
      return res.status(403).json({
        success: false,
        blocked: true,
        message: "Your account has been blocked by admin",
      });
    }

    // ======================================================
    // CREATE JWT TOKEN
    // TOKEN WILL EXPIRE AFTER 1 DAY
    // ======================================================

    const token = jwt.sign(
      {
        id: checkEmail._id,
      },
      SECRET_KEY,
      {
        expiresIn: "1d",
      }
    );

    // ======================================================
    // LOGIN SUCCESS
    // ======================================================

    return res.status(200).json({
      success: true,
      message: "Login Successful",
      token: token,
    });
  } catch (error) {
    console.log("Donor login error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};