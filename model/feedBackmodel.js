import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "user",
    },

    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "donor",
    },

    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "service",
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("feedback", feedbackSchema);