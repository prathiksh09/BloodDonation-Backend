import jwt from "jsonwebtoken";
import userModel from "../model/userModel.js";

const SECRETE_KEY = "system";

export const authUser = async (req, res, next) => {
  try {
    // getting token
    const token = req.header("token");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token not found",
      });
    }
    // verifying token

    const decoded = jwt.verify(token.trim(), SECRETE_KEY);

    // finding user

    const user = await userModel.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // checking user blocked or not

    if (user.isBlocked === true) {
      return res.status(403).json({
        success: false,
        blocked: true,
        message: "Your account has been blocked by admin",
      });
    }

    req.user = user._id;
    next();
  } catch (error) {
    console.log("Auth user error:", error);

    return res.status(401).json({
      success: false,
      message: "Token does not match or has expired",
    });
  }
};
