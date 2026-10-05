import mongoose from "mongoose";

const highlightSchema = new mongoose.Schema(
  {
    bloodGroup: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },
    healthInfo: {
      type: String,
      trim: true,
      default: "",
    },

    donateTo: {
      type: String,
      trim: true,
      default: "",
    },

    receiveFrom: {
      type: String,
      trim: true,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    order: {
      type: Number,
      default: 0,
    },

    image: {
      type: String,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },

  {
    timestamps: true,
  },
);

const highlightModel =
  mongoose.models.highlight || mongoose.model("highlight", highlightSchema);

export default highlightModel;
