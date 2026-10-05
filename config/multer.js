import multer from "multer";

import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

cloudinary.config({
  cloud_name: "a7dja13r",
  api_key: "152559245269374",
  api_secret: "IaM3jJ__6aSt88_nnGElwrAU3aU",
});

const storage = new CloudinaryStorage({
  cloudinary,
  params:{
    folder: "project"
  }
})

export const upload = multer ({storage})