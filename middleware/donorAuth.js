import jwt from "jsonwebtoken";
import donorModel from "../model/donorModel.js";

const SECRETE_KEY = "website";

export const authDonor = async (req, res, next) => {
  const token = req.header("token");

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Token not found",
    });
  }

  try {
    console.log(token, "token");

    const decoded = jwt.verify(token, SECRETE_KEY);

    console.log(decoded, "decoded donor");

    req.donor = decoded.id;

    console.log(req.donor, "donor id");

    // Find donor profile using registered donor account ID
    const donor = await donorModel.findOne({
      registerDonorId: req.donor,
    });

    // Donor profile does not exist yet
    // This allows create-donor to work after registration.
    if (!donor) {
      return next();
    }

    // Check whether admin has blocked this donor
    if (donor.isBlocked) {
      return res.status(403).json({
        success: false,
        blocked: true,
        message: "Your donor account has been blocked by admin",
      });
    }

    next();
  } catch (error) {
    console.log(error);

    return res.status(401).json({
      success: false,
      message: "Token does not match",
    });
  }
};
