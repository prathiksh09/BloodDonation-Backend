import mongoose from "mongoose";
import serviceModel from "../model/serviceModel.js";
import donorModel from "../model/donorModel.js";

// ==========================================================
// CREATE BLOOD REQUEST
// ==========================================================

export const createService = async (req, res) => {
  try {
    const { donorId, userName, age, location, contact, description } = req.body;

    // Validate required fields
    if (
      !donorId ||
      !userName ||
      !age ||
      !location ||
      !contact ||
      !description
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Validate donor ID
    if (!mongoose.Types.ObjectId.isValid(donorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid donor ID",
      });
    }

    // Get logged-in user ID
    const userId = req.user?._id || req.user?.id || req.user;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    // Check whether donor exists
    const donor = await donorModel.findById(donorId);

    if (!donor) {
      return res.status(404).json({
        success: false,
        message: "Donor not found",
      });
    }

    // Create blood request
    const storeService = await serviceModel.create({
      donorId: donor._id,
      userId: userId,
      userName: userName.trim(),
      age: Number(age),
      location: location.trim(),
      contact: String(contact).trim(),
      description: description.trim(),
      status: "pending",
    });

    return res.status(201).json({
      success: true,
      message: "Blood request created successfully",
      data: storeService,
    });
  } catch (error) {
    console.error("Create Service Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create blood request",
      error: error.message,
    });
  }
};

// ==========================================================
// GET BLOOD REQUESTS FOR LOGGED-IN USER
// ==========================================================

export const getUserRequest = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id || req.user;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    // Pagination
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 2);

    const skip = (page - 1) * limit;

    // Get total number of requests
    const totalRequest = await serviceModel.countDocuments({
      userId: userId,
    });

    // Get requests from MongoDB
    const requests = await serviceModel
      .find({
        userId: userId,
      })
      .populate("donorId", "donorName bloodGroup contact address image")
      .populate("userId", "name email")
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.max(1, Math.ceil(totalRequest / limit));

    return res.status(200).json({
      success: true,
      message: "User requests found",
      data: requests,
      totalRequests: totalRequest,
      totalPages: totalPages,
      page: page,
      limit: limit,
    });
  } catch (error) {
    console.error("Get User Requests Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get user requests",
      error: error.message,
    });
  }
};

// ==========================================================
// GET BLOOD REQUESTS FOR LOGGED-IN DONOR
// ==========================================================

export const getDonorRequests = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Number(req.query.limit) || 10);

    const skip = (page - 1) * limit;

    // Authenticate donor
    const donorAuthId =
      req.donor?._id ||
      req.donor?.id ||
      req.donor?.registerDonorId ||
      req.donor;

    if (!donorAuthId) {
      return res.status(401).json({
        success: false,
        message: "Donor authentication required",
      });
    }

    // Find donor profile
    const donorProfile = await donorModel.findOne({
      registerDonorId: donorAuthId,
    });

    if (!donorProfile) {
      return res.status(404).json({
        success: false,
        message: "Donor profile not found",
      });
    }

    // Get donor requests directly from MongoDB
    const requests = await serviceModel
      .find({
        donorId: donorProfile._id,
      })
      .populate("userId", "name email image")
      .populate("donorId", "donorName bloodGroup contact address image")
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      message: "Donor requests found",
      data: requests,
    });
  } catch (error) {
    console.error("Get Donor Requests Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get donor requests",
      error: error.message,
    });
  }
};

// ==========================================================
// GET SINGLE BLOOD REQUEST
// ==========================================================

export const getrequestId = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate request ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request ID",
      });
    }

    const request = await serviceModel
      .findById(id)
      .populate("donorId", "donorName bloodGroup contact address image")
      .populate("userId", "name email");

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Blood request not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Blood request found",
      data: request,
    });
  } catch (error) {
    console.error("Get Request Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get blood request",
      error: error.message,
    });
  }
};

// ==========================================================
// ACCEPT / REJECT BLOOD REQUEST
// ==========================================================

export const updateServiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate request ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid blood request ID",
      });
    }

    // Validate status
    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either accepted or rejected",
      });
    }

    // Get logged-in donor ID
    const donorAuthId =
      req.donor?._id ||
      req.donor?.id ||
      req.donor?.registerDonorId ||
      req.donor;

    if (!donorAuthId) {
      return res.status(401).json({
        success: false,
        message: "Donor authentication required",
      });
    }

    // Find donor profile
    const donorProfile = await donorModel.findOne({
      registerDonorId: donorAuthId,
    });

    if (!donorProfile) {
      return res.status(404).json({
        success: false,
        message: "Donor profile not found",
      });
    }

    // Find request belonging to this donor
    const service = await serviceModel.findOne({
      _id: id,
      donorId: donorProfile._id,
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Blood request not found for this donor",
      });
    }

    // Only pending requests can be accepted or rejected
    if (service.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Request has already been ${service.status}`,
      });
    }

    // Update request status
    service.status = status;

    await service.save();

    // Get updated request
    const updatedService = await serviceModel
      .findById(service._id)
      .populate("userId", "name email")
      .populate("donorId", "donorName bloodGroup contact address image");

    return res.status(200).json({
      success: true,
      message:
        status === "accepted"
          ? "Blood request accepted successfully"
          : "Blood request rejected successfully",
      data: updatedService,
    });
  } catch (error) {
    console.error("Update Service Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update blood request status",
      error: error.message,
    });
  }
};

// ==========================================================
// COMPLETE BLOOD REQUEST FROM USER SIDE
// ==========================================================

export const completeService = async (req, res) => {
  try {
    const requestId = req.params.id;

    // Get logged-in user ID
    const userId = req.user?._id || req.user?.id || req.user;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please login first",
      });
    }

    // Validate request ID
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request ID",
      });
    }

    // Find blood request
    const request = await serviceModel.findById(requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    // Ensure request belongs to logged-in user
    if (!request.userId || request.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not allowed to complete the request",
      });
    }

    // Only accepted requests can be completed
    if (request.status !== "accepted") {
      return res.status(400).json({
        success: false,
        message: "Only accepted requests can be completed",
      });
    }

    // Update status to completed
    request.status = "completed";

    await request.save();

    // Get updated completed request
    const updatedRequest = await serviceModel
      .findById(request._id)
      .populate("userId", "name email")
      .populate("donorId", "donorName bloodGroup contact address image");

    return res.status(200).json({
      success: true,
      message: "Blood request completed successfully",
      data: updatedRequest,
    });
  } catch (error) {
    console.error("Complete service Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to set completed request",
      error: error.message,
    });
  }
};

// ==========================================================
// MY DONATIONS PAGE
// ==========================================================

export const getMyDonations = async (req, res) => {
  try {
    const donorAuthId =
      req.donor?._id ||
      req.donor?.id ||
      req.donor?.registerDonorId ||
      req.donor;

    if (!donorAuthId) {
      return res.status(401).json({
        success: false,
        message: "Donor authentication required",
      });
    }

    // Find donor profile
    const donorProfile = await donorModel.findOne({
      registerDonorId: donorAuthId,
    });

    if (!donorProfile) {
      return res.status(404).json({
        success: false,
        message: "Donor profile not found",
      });
    }

    // Get completed donations directly from MongoDB
    const completedDonations = await serviceModel
      .find({
        donorId: donorProfile._id,
        status: "completed",
      })
      // Display user image in completed donations
      .populate("userId", "name email image")
      .populate("donorId", "donorName bloodGroup contact address image")
      .sort({
        updatedAt: -1,
      });

    return res.status(200).json({
      success: true,
      message:
        completedDonations.length > 0
          ? "Completed donations found"
          : "No completed donations found",
      data: completedDonations,
    });
  } catch (error) {
    console.error("Get my donations Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get completed donations",
      error: error.message,
    });
  }
};
