import mongoose from "mongoose";
import feedBackmodel from "../model/feedBackmodel.js";
import serviceModel from "../model/serviceModel.js";
import donorModel from "../model/donorModel.js";

// CREATE FEEDBACK

export const createFeedback = async (req, res) => {
  try {
    const { requestId, message } = req.body;
    const userId = req.user?._id || req.user?.id || req.user;

    // Check user login
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please login first.",
      });
    }

    // Check request ID
    if (!requestId || !mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({
        success: false,
        message: "Valid request ID is required.",
      });
    }

    // Check message
    if (!message?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Feedback message is required.",
      });
    }

    // Find blood request
    const request = await serviceModel.findById(requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Blood request not found.",
      });
    }

    // Make sure this request belongs to logged-in user
    if (request.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to give feedback for this request.",
      });
    }

    // Feedback only after donation is completed
    if (request.status !== "completed") {
      return res.status(400).json({
        success: false,
        message:
          "Feedback can only be submitted after the donation is completed.",
      });
    }

    // Check donor
    if (!request.donorId) {
      return res.status(404).json({
        success: false,
        message: "Donor information not found.",
      });
    }

    // Check whether feedback already exists
    const existingFeedback = await feedBackmodel.findOne({
      userId,
      donorId: request.donorId,
      requestId,
    });

    if (existingFeedback) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted feedback.",
      });
    }

    // Create feedback
    const feedback = await feedBackmodel.create({
      userId,
      donorId: request.donorId,
      requestId,
      message: message.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Feedback submitted successfully.",
      data: feedback,
    });
  } catch (error) {
    console.error("Create Feedback Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong.",
      error: error.message,
    });
  }
};

// GET FEEDBACK FOR LOGGED-IN DONOR

export const getDonorFeedback = async (req, res) => {
  try {
    const donorAuthId = req.donor?._id || req.donor?.id || req.donor;

    // Check donor login
    if (!donorAuthId) {
      return res.status(401).json({
        success: false,
        message: "Donor authentication required.",
      });
    }

    // Find donor profile
    let donorProfile = await donorModel.findById(donorAuthId);

    // If authentication ID belongs to registerDonorId
    if (!donorProfile) {
      donorProfile = await donorModel.findOne({
        registerDonorId: donorAuthId,
      });
    }

    if (!donorProfile) {
      return res.status(404).json({
        success: false,
        message: "Donor profile not found.",
      });
    }

    // Find feedback for this donor
    const feedback = await feedBackmodel
      .find({
        donorId: donorProfile._id,
      })
      .populate("userId", "name email")
      .populate("requestId", "userName age location contact description status")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Donor feedback found.",
      data: feedback,
    });
  } catch (error) {
    console.error("Get Donor Feedback Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get donor feedback.",
      error: error.message,
    });
  }
};

// GET FEEDBACK FOR LOGGED-IN USER

export const getUserFeedback = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user?._id || req.user?.id || req.user;

    // Check user login
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please login first.",
      });
    }

    // Check request ID
    if (!requestId || !mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({
        success: false,
        message: "Valid request ID is required.",
      });
    }

    // Find feedback
    const feedback = await feedBackmodel
      .findOne({
        requestId,
        userId,
      })
      .populate("donorId", "donorName bloodGroup contact address image")
      .populate(
        "requestId",
        "userName age location contact description status",
      );

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Feedback found.",
      data: feedback,
    });
  } catch (error) {
    console.error("Get User Feedback Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get feedback.",
      error: error.message,
    });
  }
};

// CHECK WHETHER USER ALREADY SUBMITTED FEEDBACK

export const checkFeedback = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user?._id || req.user?.id || req.user;

    // Check user login
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please login first.",
      });
    }

    // Check request ID
    if (!requestId || !mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({
        success: false,
        message: "Valid request ID is required.",
      });
    }

    // Find feedback
    const feedback = await feedBackmodel.findOne({
      requestId,
      userId,
    });

    return res.status(200).json({
      success: true,
      submitted: !!feedback,
      data: feedback || null,
    });
  } catch (error) {
    console.error("Check Feedback Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to check feedback.",
      error: error.message,
    });
  }
};
