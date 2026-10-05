import jwt from "jsonwebtoken";

export const authAdmin = (req, res, next) => {
  try {
    const token =
      req.headers.token ||
      req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Admin token required",
      });
    }

    console.log("ADMIN TOKEN RECEIVED:", token);

    const decoded = jwt.verify(token, "system");

    console.log("ADMIN TOKEN DECODED:", decoded);

    if (decoded.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    req.admin = decoded.id;

    next();
  } catch (error) {
    console.log("ADMIN JWT ERROR:", error.message);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired admin token",
    });
  }
};