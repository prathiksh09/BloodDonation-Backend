import mongoose from "mongoose";
import highlightModel from "../model/highlightModel.js";
import { client } from "../config/redis.js";

const ACTIVE_KEY = "highlights:active";

const convertToString = (value) => {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (typeof value === "string") {
    return value.trim();
  }

  return "";
};

// ==========================================================
// ADMIN - CREATE HIGHLIGHT
// ==========================================================

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

    // For adding image
    const image = req.file?.filename;

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

    // ======================================================
    // CHECK DUPLICATE BLOOD GROUP
    // ======================================================

    const existingHighlight = await highlightModel.findOne({
      bloodGroup: bloodGroup.trim(),
    });

    if (existingHighlight) {
      return res.status(409).json({
        success: false,
        message: `${bloodGroup.trim()} blood group highlight already exists`,
      });
    }

    // ======================================================
    // CONVERT VALUES TO STRING
    // ======================================================

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

    // ======================================================
    // CREATE HIGHLIGHT
    // ======================================================

    const highlight = await highlightModel.create({
      bloodGroup: bloodGroup.trim(),

      description: description.trim(),

      healthInfo: healthInfo ? healthInfo.trim() : "",

      donateTo: donateToString,

      receiveFrom: receiveFromString,

      isActive: typeof isActive === "boolean" ? isActive : true,

      order: order !== undefined ? Number(order) : 0,

      // New highlights are not deleted
      isDeleted: false,

      deletedAt: null,

      image,
    });

    // Clear Redis cache
    await client.del(ACTIVE_KEY);

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

// ==========================================================
// PUBLIC - GET ACTIVE HIGHLIGHTS
// ==========================================================

export const getActiveHighlights = async (req, res) => {
  try {
    // ======================================================
    // CHECK REDIS CACHE
    // ======================================================

    const cachedHighlights = await client.get(ACTIVE_KEY);

    if (cachedHighlights) {
      const highlights = JSON.parse(cachedHighlights);

      return res.status(200).json({
        success: true,
        count: highlights.length,
        highlights,
        message: "Highlights found from Redis",
      });
    }

    // ======================================================
    // GET ACTIVE HIGHLIGHTS FROM MONGODB
    // ======================================================

    const highlights = await highlightModel
      .find({
        isActive: true,

        // This handles both:
        // isDeleted: false
        // isDeleted field not existing
        isDeleted: {
          $ne: true,
        },
      })
      .sort({
        order: 1,
        createdAt: 1,
      });

    await client.set(ACTIVE_KEY, JSON.stringify(highlights), {
      EX: 60,
    });

    // ======================================================
    // RESPONSE
    // ======================================================

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

// ==========================================================
// ADMIN - GET ALL NON-DELETED HIGHLIGHTS
// ==========================================================

export const getAllHighlights = async (req, res) => {
  try {
    // ======================================================
    // GET ALL HIGHLIGHTS EXCEPT BIN ITEMS
    // ======================================================

    const highlights = await highlightModel
      .find({
        // Show:
        // isDeleted: false
        // OR isDeleted field does not exist

        // Hide:
        // isDeleted: true
        isDeleted: {
          $ne: true,
        },
      })
      .sort({
        order: 1,
        createdAt: 1,
      });

    // ======================================================
    // RESPONSE
    // ======================================================

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

// ==========================================================
// ADMIN - GET DELETED HIGHLIGHTS / BIN
// ==========================================================

export const getDeletedHighlights = async (req, res) => {
  try {
    // ======================================================
    // GET ONLY DELETED HIGHLIGHTS
    // ======================================================

    const highlights = await highlightModel
      .find({
        isDeleted: true,
      })
      .sort({
        deletedAt: -1,
      });

    // ======================================================
    // RESPONSE
    // ======================================================

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

// ==========================================================
// ADMIN - GET SINGLE HIGHLIGHT
// ==========================================================

export const getHighlightById = async (req, res) => {
  try {
    const { id } = req.params;

    // ======================================================
    // CHECK ID
    // ======================================================

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid highlight ID",
      });
    }

    // ======================================================
    // FIND HIGHLIGHT
    // ======================================================

    const highlight = await highlightModel.findOne({
      _id: id,

      // Do not return items in Bin
      isDeleted: {
        $ne: true,
      },
    });

    // ======================================================
    // NOT FOUND
    // ======================================================

    if (!highlight) {
      return res.status(404).json({
        success: false,
        message: "Highlight not found",
      });
    }

    // ======================================================
    // RESPONSE
    // ======================================================

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

// ==========================================================
// ADMIN - UPDATE HIGHLIGHT
// ==========================================================

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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid highlight ID",
      });
    }

    // ======================================================
    // FIND HIGHLIGHT
    // ======================================================

    const existingHighlight = await highlightModel.findOne({
      _id: id,

      // Do not update items already in Bin
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

    // ======================================================
    // BLOOD GROUP
    // ======================================================

    if (bloodGroup !== undefined) {
      if (!bloodGroup.trim()) {
        return res.status(400).json({
          success: false,
          message: "Blood group cannot be empty",
        });
      }

      // ====================================================
      // CHECK DUPLICATE BLOOD GROUP
      // ====================================================

      const duplicateHighlight = await highlightModel.findOne({
        bloodGroup: bloodGroup.trim(),
        _id: { $ne: id },
      });

      if (duplicateHighlight) {
        return res.status(409).json({
          success: false,
          message: `${bloodGroup.trim()} blood group highlight already exists`,
        });
      }

      existingHighlight.bloodGroup = bloodGroup.trim();
    }

    // ======================================================
    // DESCRIPTION
    // ======================================================

    if (description !== undefined) {
      if (!description.trim()) {
        return res.status(400).json({
          success: false,
          message: "Description cannot be empty",
        });
      }

      existingHighlight.description = description.trim();
    }

    // ======================================================
    // HEALTH / DISEASE INFORMATION
    // ======================================================

    if (healthInfo !== undefined) {
      existingHighlight.healthInfo = healthInfo.trim();
    }

    // ======================================================
    // DONATE TO
    // ======================================================

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

    // ======================================================
    // RECEIVE FROM
    // ======================================================

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

    // ======================================================
    // ACTIVE STATUS
    // ======================================================

    if (isActive !== undefined) {
      existingHighlight.isActive = Boolean(isActive);
    }

    // ======================================================
    // ORDER
    // ======================================================

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

    // ======================================================
    // IMAGE
    // ======================================================

    if (req.file) {
      existingHighlight.image = req.file.filename;
    }

    // ======================================================
    // SAVE
    // ======================================================

    const updatedHighlight = await existingHighlight.save();

    await client.del(ACTIVE_KEY);

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

// ==========================================================
// ADMIN - MOVE HIGHLIGHT TO BIN
// ==========================================================

export const deleteHighlight = async (req, res) => {
  try {
    const { id } = req.params;

    // ======================================================
    // CHECK ID
    // ======================================================

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid highlight ID",
      });
    }

    // ======================================================
    // FIND HIGHLIGHT
    // ======================================================

    const highlight = await highlightModel.findOne({
      _id: id,

      // Allow old documents where isDeleted is missing
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

    // ======================================================
    // MOVE TO BIN
    // ======================================================

    highlight.isDeleted = true;

    highlight.deletedAt = new Date();

    await highlight.save();

    await client.del(ACTIVE_KEY);

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

// ==========================================================
// ADMIN - RESTORE HIGHLIGHT FROM BIN
// ==========================================================

export const restoreHighlight = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid highlight ID",
      });
    }

    // ======================================================
    // FIND DELETED HIGHLIGHT
    // ======================================================

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

    // ======================================================
    // RESTORE
    // ======================================================

    highlight.isDeleted = false;

    highlight.deletedAt = null;

    await highlight.save();

    // ======================================================
    // CLEAR REDIS CACHE
    // ======================================================

    await client.del(ACTIVE_KEY);

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

// ==========================================================
// ADMIN - PERMANENTLY DELETE HIGHLIGHT
// ==========================================================

export const permanentlyDeleteHighlight = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid highlight ID",
      });
    }

    // ======================================================
    // DELETE ONLY FROM BIN
    // ======================================================

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

    await client.del(ACTIVE_KEY);

    // ======================================================
    // RESPONSE
    // ======================================================

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

// ==========================================================
// ADMIN - TOGGLE HIGHLIGHT STATUS
// ==========================================================

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

    await client.del(ACTIVE_KEY);

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
