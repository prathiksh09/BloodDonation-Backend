import userModel from "../model/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sendEmail } from "../config/mail.js";

// creating user
export const createUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const image = req.file?.filename;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    const checkEmail = await userModel.findOne({
      email: email.toLowerCase(),
    });

    if (checkEmail) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const storeUser = await userModel.create({
      name,
      email: email.toLowerCase(),
      password: hashPassword,
      image,
    });

    return res.status(201).json({
      success: true,
      message: "User created successfully",

      data: {
        id: storeUser._id,
        name: storeUser.name,
        email: storeUser.email,
        image: storeUser.image,
      },
    });
  } catch (error) {
    console.log("Create user error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// for user login

export const useLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // finding the user

    const checkEmail = await userModel.findOne({
      email: email.toLowerCase(),
    });

    if (!checkEmail) {
      return res.status(404).json({
        success: false,
        message: "User is not registered",
      });
    }

    // checking if it is blooked

    if (checkEmail.isBlocked === true) {
      return res.status(403).json({
        success: false,
        blocked: true,
        message: "Your account has been blocked by admin",
      });
    }

    // CHECK PASSWORD

    const comparePassword = await bcrypt.compare(password, checkEmail.password);

    if (!comparePassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }
    // creating jwt

    const token = jwt.sign(
      {
        id: checkEmail._id,
      },
      "system",
      {
        expiresIn: "1d",
      },
    );

    await sendEmail(
      checkEmail.email,
      "Login",
      "Login detected on your account",
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",

      token,

      user: {
        id: checkEmail._id,
        name: checkEmail.name,
        email: checkEmail.email,
        image: checkEmail.image,
      },
    });
  } catch (error) {
    console.log("Login error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// getting all users to admin

export const getAllUsers = async (req, res) => {
  try {
    const users = await userModel.find().select("-password").sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.log("Get all users error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};

// CHECK CURRENT USER STATUS

export const checkUserStatus = async (req, res) => {
  try {
    const user = await userModel.findById(req.user);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // USER BLOCKED

    if (user.isBlocked === true) {
      return res.status(403).json({
        success: false,
        blocked: true,
        message: "Your account has been blocked by admin",
      });
    }

    return res.status(200).json({
      success: true,
      blocked: false,
      message: "User account is active",
    });
  } catch (error) {
    console.log("Check user status error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to check user status",
    });
  }
};
