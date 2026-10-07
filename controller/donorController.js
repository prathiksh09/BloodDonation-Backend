import mongoose from "mongoose";
import highlightModel from "../model/highlightModel.js";
import { client } from "../config/redis.js";

// Simple Redis key
const HIGHLIGHT_KEY = "highlights";

// CONVERT VALUE TO STRING

const convertToString = (value) => {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (typeof value === "string") {
    return value.trim();
  }

  return "";
};

// ADMIN - CREATE HIGHLIGHT

export const createHighlight = async (req, res) => {
  try {
    const {
      bloodGroup,
      description,
      healthInfo,
      donateTo,
      receiveFrom,
      isActive,
      order,
    } = req.body;

    // Image
    const image = req.file?.filename;

    // VALIDATION

    if (!bloodGroup) {
      return res.status(400).json({
        success: false,
        message: "Blood group is required",
      });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: "Description is required",
      });
    }

    if (!donateTo) {
      return res.status(400).json({
        success: false,
        message: "Donate To is required",
      });
    }

    if (!receiveFrom) {
      return res.status(400).json({
        success: false,
        message: "Receive From is required",
      });
    }

    // CHECK DUPLICATE BLOOD GROUP

    const existingHighlight = await highlightModel.findOne({
      bloodGroup: bloodGroup.trim(),
    });

    if (existingHighlight) {
      return res.status(409).json({
        success: false,
        message: `${bloodGroup.trim()} blood group highlight already exists`,
      });
    }

    // CONVERT VALUES TO STRING

    const donateToString = convertToString(donateTo);
    const receiveFromString = convertToString(receiveFrom);

    if (!donateToString) {
      return res.status(400).json({
        success: false,
        message: "Donate To cannot be empty",
      });
    }

    if (!receiveFromString) {
      return res.status(400).json({
        success: false,
        message: "Receive From cannot be empty",
      });
    }

    // CREATE HIGHLIGHT

    const highlight = await highlightModel.create({
      bloodGroup: bloodGroup.trim(),
      description: description.trim(),
      healthInfo: healthInfo ? healthInfo.trim() : "",
      donateTo: donateToString,
      receiveFrom: receiveFromString,
      isActive: typeof isActive === "boolean" ? isActive : true,
      order: order !== undefined ? Number(order) : 0,

      // New highlight is not deleted
      isDeleted: false,
      deletedAt: null,

      image,
    });

    // CLEAR REDIS CACHE

    try {
      await client.del(HIGHLIGHT_KEY);
    } catch (redisError) {
      console.error("REDIS CACHE CLEAR ERROR:", redisError.message);
    }

    return res.status(201).json({
      success: true,
      message: "Highlight created successfully",
      highlight,
    });
  } catch (error) {
    console.error("CREATE HIGHLIGHT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create highlight",
      error: error.message,
    });
  }
};

// PUBLIC - GET ACTIVE HIGHLIGHTS

export const getActiveHighlights = async (req, res) => {
  try {
    // CHECK REDIS

    try {
      const cachedHighlights = await client.get(HIGHLIGHT_KEY);

      if (cachedHighlights) {
        const highlights = JSON.parse(cachedHighlights);

        return res.status(200).json({
          success: true,
          count: highlights.length,
          highlights,
          message: "Highlights found from Redis",
        });
      }
    } catch (redisError) {
      console.error("REDIS GET ERROR:", redisError.message);
    }

    // GET FROM MONGODB

    const highlights = await highlightModel
      .find({
        isActive: true,
        isDeleted: {
          $ne: true,
        },
      })
      .sort({
        order: 1,
        createdAt: 1,
      });

    // SAVE IN REDIS

    try {
      await client.set(HIGHLIGHT_KEY, JSON.stringify(highlights), {
        EX: 60,
      });
    } catch (redisError) {
      console.error("REDIS SET ERROR:", redisError.message);
    }

    return res.status(200).json({
      success: true,
      count: highlights.length,
      highlights,
      message: "Highlights found from MongoDB",
    });
  } catch (error) {
    console.error("GET ACTIVE HIGHLIGHTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch highlights",
      error: error.message,
    });
  }
};

// ADMIN - GET ALL NON-DELETED HIGHLIGHTS

export const getAllHighlights = async (req, res) => {
  try {
    const highlights = await highlightModel
      .find({
        isDeleted: {
          $ne: true,
        },
      })
      .sort({
        order: 1,
        createdAt: 1,
      });

    return res.status(200).json({
      success: true,
      count: highlights.length,
      highlights,
    });
  } catch (error) {
    console.error("GET ALL HIGHLIGHTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch highlights",
      error: error.message,
    });
  }
};

// ADMIN - GET DELETED HIGHLIGHTS / BIN

export const getDeletedHighlights = async (req, res) => {
  try {
    const highlights = await highlightModel
      .find({
        isDeleted: true,
      })
      .sort({
        deletedAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: highlights.length,
      highlights,
    });
  } catch (error) {
    console.error("GET DELETED HIGHLIGHTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch deleted highlights",
      error: error.message,
    });
  }
};

// ADMIN - GET SINGLE HIGHLIGHT

export const getHighlightById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid highlight ID",
      });
    }

    const highlight = await highlightModel.findOne({
      _id: id,
      isDeleted: {
        $ne: true,
      },
    });

    if (!highlight) {
      return res.status(404).json({
        success: false,
        message: "Highlight not found",
      });
    }

    return res.status(200).json({
      success: true,
      highlight,
    });
  } catch (error) {
    console.error("GET HIGHLIGHT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch highlight",
      error: error.message,
    });
  }
};

// ADMIN - UPDATE HIGHLIGHT

export const updateHighlight = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      bloodGroup,
      description,
      healthInfo,
      donateTo,
      receiveFrom,
      isActive,
      order,
    } = req.body;

    // CHECK ID

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid highlight ID",
      });
    }

    // FIND HIGHLIGHT

    const existingHighlight = await highlightModel.findOne({
      _id: id,
      isDeleted: {
        $ne: true,
      },
    });

    if (!existingHighlight) {
      return res.status(404).json({
        success: false,
        message: "Highlight not found",
      });
    }

    // BLOOD GROUP

    if (bloodGroup !== undefined) {
      if (!bloodGroup.trim()) {
        return res.status(400).json({
          success: false,
          message: "Blood group cannot be empty",
        });
      }

      const duplicateHighlight = await highlightModel.findOne({
        bloodGroup: bloodGroup.trim(),
        _id: {
          $ne: id,
        },
      });

      if (duplicateHighlight) {
        return res.status(409).json({
          success: false,
          message: `${bloodGroup.trim()} blood group highlight already exists`,
        });
      }

      existingHighlight.bloodGroup = bloodGroup.trim();
    }

    // DESCRIPTION

    if (description !== undefined) {
      if (!description.trim()) {
        return res.status(400).json({
          success: false,
          message: "Description cannot be empty",
        });
      }

      existingHighlight.description = description.trim();
    }

    // HEALTH INFO

    if (healthInfo !== undefined) {
      existingHighlight.healthInfo = healthInfo.trim();
    }

    // DONATE TO

    if (donateTo !== undefined) {
      const donateToString = convertToString(donateTo);

      if (!donateToString) {
        return res.status(400).json({
          success: false,
          message: "Donate To cannot be empty",
        });
      }

      existingHighlight.donateTo = donateToString;
    }

    // RECEIVE FROM

    if (receiveFrom !== undefined) {
      const receiveFromString = convertToString(receiveFrom);

      if (!receiveFromString) {
        return res.status(400).json({
          success: false,
          message: "Receive From cannot be empty",
        });
      }

      existingHighlight.receiveFrom = receiveFromString;
    }

    // ACTIVE STATUS

    if (isActive !== undefined) {
      existingHighlight.isActive = Boolean(isActive);
    }

    // ORDER

    if (order !== undefined) {
      const numberOrder = Number(order);

      if (Number.isNaN(numberOrder)) {
        return res.status(400).json({
          success: false,
          message: "Order must be a number",
        });
      }

      existingHighlight.order = numberOrder;
    }

    // IMAGE

    if (req.file) {
      existingHighlight.image = req.file.filename;
    }

    // SAVE

    const updatedHighlight = await existingHighlight.save();

    // Clear Redis
    try {
      await client.del(HIGHLIGHT_KEY);
    } catch (redisError) {
      console.error("REDIS CACHE CLEAR ERROR:", redisError.message);
    }

    return res.status(200).json({
      success: true,
      message: "Highlight updated successfully",
      highlight: updatedHighlight,
    });
  } catch (error) {
    console.error("UPDATE HIGHLIGHT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update highlight",
      error: error.message,
    });
  }
};

// ADMIN - MOVE HIGHLIGHT TO BIN

export const deleteHighlight = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid highlight ID",
      });
    }

    const highlight = await highlightModel.findOne({
      _id: id,
      isDeleted: {
        $ne: true,
      },
    });

    if (!highlight) {
      return res.status(404).json({
        success: false,
        message: "Highlight not found",
      });
    }

    highlight.isDeleted = true;
    highlight.deletedAt = new Date();

    await highlight.save();

    // Clear Redis
    try {
      await client.del(HIGHLIGHT_KEY);
    } catch (redisError) {
      console.error("REDIS CACHE CLEAR ERROR:", redisError.message);
    }

    return res.status(200).json({
      success: true,
      message: "Highlight moved to bin successfully",
      highlight,
    });
  } catch (error) {
    console.error("MOVE HIGHLIGHT TO BIN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to move highlight to bin",
      error: error.message,
    });
  }
};

// ADMIN - RESTORE HIGHLIGHT

export const restoreHighlight = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid highlight ID",
      });
    }

    const highlight = await highlightModel.findOne({
      _id: id,
      isDeleted: true,
    });

    if (!highlight) {
      return res.status(404).json({
        success: false,
        message: "Deleted highlight not found",
      });
    }

    highlight.isDeleted = false;
    highlight.deletedAt = null;

    await highlight.save();

    // Clear Redis
    try {
      await client.del(HIGHLIGHT_KEY);
    } catch (redisError) {
      console.error("REDIS CACHE CLEAR ERROR:", redisError.message);
    }

    return res.status(200).json({
      success: true,
      message: "Highlight restored successfully",
      highlight,
    });
  } catch (error) {
    console.error("RESTORE HIGHLIGHT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to restore highlight",
      error: error.message,
    });
  }
};

// ADMIN - PERMANENTLY DELETE HIGHLIGHT

export const permanentlyDeleteHighlight = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid highlight ID",
      });
    }

    const highlight = await highlightModel.findOneAndDelete({
      _id: id,
      isDeleted: true,
    });

    if (!highlight) {
      return res.status(404).json({
        success: false,
        message: "Deleted highlight not found",
      });
    }

    // Clear Redis
    try {
      await client.del(HIGHLIGHT_KEY);
    } catch (redisError) {
      console.error("REDIS CACHE CLEAR ERROR:", redisError.message);
    }

    return res.status(200).json({
      success: true,
      message: "Highlight permanently deleted",
    });
  } catch (error) {
    console.error("PERMANENT DELETE HIGHLIGHT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to permanently delete highlight",
      error: error.message,
    });
  }
};

// ADMIN - TOGGLE HIGHLIGHT STATUS

export const toggleHighlightStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid highlight ID",
      });
    }

    const highlight = await highlightModel.findOne({
      _id: id,
      isDeleted: {
        $ne: true,
      },
    });

    if (!highlight) {
      return res.status(404).json({
        success: false,
        message: "Highlight not found",
      });
    }

    highlight.isActive = !highlight.isActive;

    await highlight.save();

    // Clear Redis
    try {
      await client.del(HIGHLIGHT_KEY);
    } catch (redisError) {
      console.error("REDIS CACHE CLEAR ERROR:", redisError.message);
    }

    return res.status(200).json({
      success: true,
      message: `Highlight ${
        highlight.isActive ? "activated" : "deactivated"
      } successfully`,
      highlight,
    });
  } catch (error) {
    console.error("TOGGLE HIGHLIGHT STATUS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to change highlight status",
      error: error.message,
    });
  }
};
