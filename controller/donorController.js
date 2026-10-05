import mongoose from "mongoose";
import { client } from "../config/redis.js";
import donorModel from "../model/donorModel.js";

// CREATE DONOR DETAILS

export const createDonor = async (req, res) => {
  try {
    const { donorName, age, bloodGroup, contact, address } = req.body;

    const image = req.file?.filename;

    const storeBlood = await donorModel.create({
      donorName,
      age,
      bloodGroup,
      contact,
      address,
      image,

      // Logged-in donor registered account ID
      registerDonorId: req.donor,

      // New donor is active by default
      isBlocked: false,
    });

    console.log(storeBlood, "storeBlood");

    // CLEAR ALL DONOR PAGINATION CACHE

    const donorKeys = await client.keys("donor:page:*");

    if (donorKeys.length > 0) {
      await Promise.all(donorKeys.map((key) => client.del(key)));
    }

    return res.json({
      success: true,
      message: "Donor details saved successfully",
      data: storeBlood,
    });
  } catch (error) {
    return res.json({
      success: false,
      message: error.message,
    });
  }
};

// GET ALL DONORS - WITH PAGINATION

export const getAllDonor = async (req, res) => {
  try {
    // PAGINATION

    const page = Math.max(1, parseInt(req.query.page) || 1);

    const limit = Math.max(1, parseInt(req.query.limit) || 10);

    const skip = (page - 1) * limit;

    const cacheKey = `donor:page:${page}:limit:${limit}`;

    const getFromRedis = await client.get(cacheKey);

    if (getFromRedis) {
      const cachedData = JSON.parse(getFromRedis);

      return res.json({
        success: true,
        message: "Donors found from redis",
        data: cachedData.data,
        currentPage: cachedData.currentPage,
        totalPages: cachedData.totalPages,
        totalDonors: cachedData.totalDonors,
      });
    }

    const totalDonors = await donorModel.countDocuments();

    const find = await donorModel
      .find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalDonors / limit);

    const responseData = {
      data: find,
      currentPage: page,
      totalPages: totalPages,
      totalDonors: totalDonors,
    };

    await client.set(cacheKey, JSON.stringify(responseData), {
      EX: 60,
    });

    return res.json({
      success: true,
      message: "Donors found from database",
      data: find,
      currentPage: page,
      totalPages: totalPages,
      totalDonors: totalDonors,
    });
  } catch (error) {
    return res.json({
      success: false,
      message: error.message,
    });
  }
};

// GET LOGGED-IN DONOR DETAILS

export const getMyDonorDetails = async (req, res) => {
  try {
    const donor = await donorModel.findOne({
      registerDonorId: req.donor,
    });

    if (!donor) {
      return res.json({
        success: false,
        message: "Donor profile not found",
      });
    }

    return res.json({
      success: true,
      message: "Donor details found",
      data: donor,
    });
  } catch (error) {
    return res.json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE DONOR

export const deleteDonor = async (req, res) => {
  try {
    const { id } = req.params;

    // VALIDATE DONOR ID

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid donor ID",
      });
    }

    // DELETE DONOR FROM MONGODB

    const deletedDonor = await donorModel.findByIdAndDelete(id);

    if (!deletedDonor) {
      return res.status(404).json({
        success: false,
        message: "Donor not found",
      });
    }

    // CLEAR ALL DONOR PAGINATION CACHE

    const donorKeys = await client.keys("donor:page:*");

    if (donorKeys.length > 0) {
      await Promise.all(donorKeys.map((key) => client.del(key)));
    }

    // CLEAR THIS DONOR'S COMPLETED DONATIONS CACHE

    await client.del(`donor:${id}:completed-donations`);

    // CLEAR THIS DONOR'S REQUEST CACHE

    const donorRequestKeys = await client.keys(`donor:${id}:requests:page:*`);

    if (donorRequestKeys.length > 0) {
      await Promise.all(donorRequestKeys.map((key) => client.del(key)));
    }

    // RESPONSE

    return res.status(200).json({
      success: true,
      message: "Donor deleted successfully",
      data: deletedDonor,
    });
  } catch (error) {
    console.error("Delete Donor Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete donor",
      error: error.message,
    });
  }
};
