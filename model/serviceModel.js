import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: true,
    },

    age: {
      type: Number,
      required: true,
    },

    location: {
      type: String,
      required: true,
    },

    contact: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "completed"],
      default: "pending",
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "donor",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("service", serviceSchema);
