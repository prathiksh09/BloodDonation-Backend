import mongoose from "mongoose";

export const connectDb = () =>{
    try {
    mongoose.connect("mongodb+srv://prathiksh545_db_user:HxYQhbDzDFsmMjPc@cluster0.thbxjl9.mongodb.net/bloodDonation");
    console.log("mongoose db connected");
} catch(error){
    console.log("mongoose error");

}
};
