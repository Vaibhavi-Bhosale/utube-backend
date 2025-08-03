import dotenv from "dotenv";
dotenv.config();

import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        //upload file on the cloudinary

        const uploadResult = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });

        console.log("File uploaded successfully !");
        fs.unlinkSync(localFilePath)

        return uploadResult;
    } catch (err) {
        console.log(err);
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath); //remove the locally save temporary file as upload operation failed
        }
        return null;
    }
};

const deleteFromCloudinary = async (publicId) => {
    try {
        if (!publicId) return null;

        const deleteResult = await cloudinary.uploader.destroy(publicId);
        console.log("Image deleted successfully!");
        return deleteResult;
    } catch (error) {
        console.error("Error deleting image:", error);
        return null;
    }
};


export { uploadOnCloudinary,  deleteFromCloudinary};
