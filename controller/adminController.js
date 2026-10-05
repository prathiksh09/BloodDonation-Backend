import adminModel from "../model/adminModel.js";
import userModel from "../model/userModel.js";
import donorModel from "../model/donorModel.js";
import { client } from "../config/redis.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// CREATE ADMIN

export const createAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    // Check existing admin
    const checkEmail = await adminModel.findOne({
      email: email.toLowerCase(),
    });

    if (checkEmail) {
      return res.status(409).json({
        success: false,
        message: "Admin with this email already exists",
      });
    }

    // Hash password
    const hashPassword = await bcrypt.hash(password, 10);

    // Create admin
    const storeAdmin = await adminModel.create({
      name,
      email: email.toLowerCase(),
      password: hashPassword,
    });

    return res.status(201).json({
      success: true,
      message: "Admin created successfully",
      data: {
        id: storeAdmin._id,
        name: storeAdmin.name,
        email: storeAdmin.email,
      },
    });
  } catch (error) {
    console.log("Create admin error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ADMIN LOGIN

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find admin
    const checkEmail = await adminModel.findOne({
      email: email.toLowerCase(),
    });

    if (!checkEmail) {
      return res.status(404).json({
        success: false,
        message: "Admin is not registered",
      });
    }

    // Compare password
    const comparePassword = await bcrypt.compare(password, checkEmail.password);

    if (!comparePassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials",
      });
    }

    // Create admin token
    const token = jwt.sign(
      {
        id: checkEmail._id,
        role: "admin",
      },
      "system",
      {
        expiresIn: "1d",
      },
    );

    return res.status(200).json({
      success: true,
      message: "Admin login successful",
      token,

      admin: {
        id: checkEmail._id,
        name: checkEmail.name,
        email: checkEmail.email,
      },
    });
  } catch (error) {
    console.log("Admin login error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// BLOCK / UNBLOCK REGISTERED USER - ADMIN

export const updateUserBlockStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isBlocked } = req.body;

    // Check user ID
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Check block status
    if (typeof isBlocked !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isBlocked must be true or false",
      });
    }

    // Find user
    const user = await userModel.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update block status
    user.isBlocked = isBlocked;

    await user.save();

    return res.status(200).json({
      success: true,
      message: isBlocked
        ? "User blocked successfully"
        : "User unblocked successfully",

      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        isBlocked: user.isBlocked,
      },
    });
  } catch (error) {
    console.log("Update user block status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update user block status",
      error: error.message,
    });
  }
};


// BLOCK / UNBLOCK DONOR - ADMIN

export const updateDonorBlockStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isBlocked } = req.body;

    // Check donor ID
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Donor ID is required",
      });
    }

    // Check block status
    if (typeof isBlocked !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isBlocked must be true or false",
      });
    }

    // Find donor
    const donor = await donorModel.findById(id);

    if (!donor) {
      return res.status(404).json({
        success: false,
        message: "Donor not found",
      });
    }

    // Update donor block status
    donor.isBlocked = isBlocked;

    await donor.save();

    // Clear donor Redis cache
    await client.del("donor");

    return res.status(200).json({
      success: true,

      message: isBlocked
        ? "Donor blocked successfully"
        : "Donor unblocked successfully",

      data: {
        id: donor._id,
        donorName: donor.donorName,
        bloodGroup: donor.bloodGroup,
        contact: donor.contact,
        isBlocked: donor.isBlocked,
      },
    });
  } catch (error) {
    console.log("Update donor block status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update donor block status",
      error: error.message,
    });
  }
};
