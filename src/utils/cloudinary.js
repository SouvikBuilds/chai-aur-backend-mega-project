import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// console.log("🔍 DEBUG - Environment Variables:");
// console.log("CLOUDINARY_CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME);
// console.log("CLOUDINARY_API_KEY:", process.env.CLOUDINARY_API_KEY);
// console.log("CLOUDINARY_CLOUD_SECRET:", process.env.CLOUDINARY_CLOUD_SECRET);

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_CLOUD_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      // console.log("❌ No file path provided");
      return null;
    }

    // console.log("📤 Uploading file to Cloudinary:", localFilePath);

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // console.log("✅ File uploaded to Cloudinary successfully!");
    // console.log("🔗 Cloudinary URL:", response.url);

    fs.unlinkSync(localFilePath);
    // console.log("🗑️ Local temp file deleted");

    return response;
  } catch (error) {
    console.error("❌ Cloudinary upload error:", error.message);

    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
      console.log("🗑️ Local temp file deleted after error");
    }
    return null;
  }
};

export { uploadOnCloudinary };
