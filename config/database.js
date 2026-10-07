import mongoose from "mongoose";
import dns from "dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]); //Google public DNS server

export const connectDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("mongoose db connected");
  } catch (error) {
    console.log("mongoose error:", error.message);
  }
};
