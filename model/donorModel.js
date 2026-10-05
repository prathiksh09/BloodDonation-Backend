import mongoose from "mongoose";

const donorSchema = new mongoose.Schema(
  {
    donorName: {
      type: String,
      required: true,
    },

    age: {
      type: Number,
      required: true,
    },

    bloodGroup: {
      type: String,
      required: true,
    },

    address: {
      type: String,
      required: true,
    },

    contact: {
      type: String,
      required: true,
    },

    image: {
      type: String,
    },

    // Registered donor account ID
    registerDonorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "register",
      required: true,
    },

    // Admin can block/unblock donor
    isBlocked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("donor", donorSchema);
