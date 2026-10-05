import mongoose from "mongoose";

export const connectDb = () =>{
    try {
    mongoose.connect("mongodb://localhost:27017/bloodDonation");
    console.log("mongoose db connected");
} catch(error){
    console.log("mongoose error");

}
};