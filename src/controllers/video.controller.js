import mongoose, { isValidObjectId } from "mongoose";
import { video as Video } from "../models/video.model.js";
import { user as User } from "../models/user.model.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const publishAVideo = asyncHandler(async (req, res, next) => {
  try {
    console.log("=== PUBLISH VIDEO STARTED ===");
    console.log("req.body:", req.body);
    console.log("req.files:", req.files);
    console.log("req.user:", req.user);

    const { title, description } = req.body;

    if (!title || !description) {
      console.log("❌ Error: Title or description missing");
      throw new ApiErrors(400, "Title and description is required");
    }

    if (title.trim() === "" || description.trim() === "") {
      console.log("❌ Error: Title or description empty");
      throw new ApiErrors(400, "Title and description cannot be empty");
    }

    const videoLocalPath = req.files?.videoFile?.[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

    console.log("Video Local Path:", videoLocalPath);
    console.log("Thumbnail Local Path:", thumbnailLocalPath);

    if (!videoLocalPath) {
      console.log("❌ Error: Video file missing");
      throw new ApiErrors(400, "video file is required");
    }

    if (!thumbnailLocalPath) {
      console.log("❌ Error: Thumbnail missing");
      throw new ApiErrors(400, "thumbnail is required");
    }

    console.log("📤 Uploading video to Cloudinary...");
    const videoFile = await uploadOnCloudinary(videoLocalPath);
    console.log("Video uploaded:", videoFile);

    if (!videoFile) {
      console.log("❌ Error: Video upload failed");
      throw new ApiErrors(
        500,
        "Something went wrong while uploading video on cloudinary"
      );
    }

    console.log("📤 Uploading thumbnail to Cloudinary...");
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    console.log("Thumbnail uploaded:", thumbnail);

    if (!thumbnail) {
      console.log("❌ Error: Thumbnail upload failed");
      throw new ApiErrors(
        500,
        "Something went wrong while uploading thumbnail on cloudinary"
      );
    }

    console.log("💾 Creating video in database...");
    const video = await Video.create({
      videoFile: videoFile.url,
      thumbnail: thumbnail.url,
      title,
      description,
      duration: videoFile.duration,
      owner: req.user?._id,
    });

    console.log("✅ Video created successfully:", video);

    return res
      .status(201)
      .json(new ApiResponse(201, video, "Video Published Successfully"));
  } catch (error) {
    console.log("❌❌❌ ERROR IN PUBLISH VIDEO ❌❌❌");
    console.log("Error message:", error?.message);
    console.log("Error stack:", error?.stack);
    console.log("Full error:", error);
    throw new ApiErrors(500, error?.message || "Something went wrong");
  }
});
const getAllVideos = asyncHandler(async (req, res, next) => {
  try {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
    const filter = { isPublished: true };
    if (userId) {
      if (!isValidObjectId(userId)) {
        throw new ApiErrors(400, "Invalid User Id");
      }
      filter.owner = userId;
    }
    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ];
    }
    const sort = {};
    if (sortBy) {
      sort[sortBy] = sortType === "desc" ? -1 : 1;
    } else {
      sort.createdAt = -1;
    }
    const skip = (page - 1) * limit;
    const videos = await Video.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("owner", "username fullName avatar");
    const totalVideos = await Video.countDocuments(filter);
    const totalPages = Math.ceil(totalVideos / limit);
    const currentPage = parseInt(page);
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { videos, totalVideos, totalPages, currentPage },
          "Videos Fetched Successfully"
        )
      );
  } catch (error) {
    throw new ApiErrors(500, error?.message);
  }
});

const getVideoById = asyncHandler(async (req, res, next) => {
  try {
    const { videoId } = req.params;
    if (!isValidObjectId(videoId)) {
      throw new ApiErrors(400, "Invalid Object Id");
    }
    const video = await Video.findById(videoId).populate(
      "owner",
      "username fullName avatar"
    );
    if (!video) {
      throw new ApiErrors(404, "Video Not Found");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, video, "video fetched by id successfully"));
  } catch (error) {
    throw new ApiErrors(500, error?.message);
  }
});

const updateVideo = asyncHandler(async (req, res, next) => {
  try {
    console.log("=== UPDATE VIDEO STARTED ===");
    console.log("req.params:", req.params);
    console.log("req.body:", req.body);
    console.log("req.files:", req.files);
    console.log("req.user:", req.user);

    const { videoId } = req.params;
    console.log("videoId:", videoId);

    if (!isValidObjectId(videoId)) {
      console.log("❌ Invalid ObjectId");
      throw new ApiErrors(400, "Invalid Video Object Id");
    }
    console.log("✅ Valid ObjectId");

    const video = await Video.findById(videoId);
    console.log("Video found:", video);

    if (!video) {
      console.log("❌ Video not found");
      throw new ApiErrors(404, "Video doesn't exist");
    }
    console.log("✅ Video exists");

    const { title, description } = req.body || {}; // ✅ Added safety check
    console.log("Title from body:", title);
    console.log("Description from body:", description);

    const updatedData = {};

    if (title?.trim()) {
      updatedData.title = title.trim();
      console.log("✅ Title will be updated:", updatedData.title);
    }

    if (description?.trim()) {
      updatedData.description = description.trim();
      console.log("✅ Description will be updated:", updatedData.description);
    }

    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;
    console.log("Thumbnail local path:", thumbnailLocalPath);

    if (thumbnailLocalPath) {
      console.log("📤 Uploading thumbnail to Cloudinary...");
      const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
      console.log("Thumbnail uploaded:", thumbnail);

      if (!thumbnail) {
        console.log("❌ Thumbnail upload failed");
        throw new ApiErrors(500, "Thumbnail upload failed");
      }
      updatedData.thumbnail = thumbnail.url;
      console.log("✅ Thumbnail URL added to update:", thumbnail.url);
    }

    const videoFileLocalPath = req.files?.videoFile?.[0]?.path;
    console.log("Video file local path:", videoFileLocalPath);

    if (videoFileLocalPath) {
      // ✅ Fixed the condition from !videoFileLocalPath to videoFileLocalPath
      console.log("📤 Uploading video file to Cloudinary...");
      const videoFile = await uploadOnCloudinary(videoFileLocalPath);
      console.log("Video file uploaded:", videoFile);

      if (!videoFile) {
        console.log("❌ Video file upload failed");
        throw new ApiErrors(500, "Video File upload failed"); // ✅ Changed to 500
      }
      updatedData.videoFile = videoFile.url;
      updatedData.duration = videoFile.duration;
      console.log(
        "✅ Video file URL and duration added:",
        videoFile.url,
        videoFile.duration
      );
    }

    console.log("Final updatedData object:", updatedData);

    if (Object.keys(updatedData).length === 0) {
      console.log("❌ No fields to update");
      throw new ApiErrors(400, "No fields to update");
    }

    console.log("💾 Updating video in database...");
    const updatedVideo = await Video.findByIdAndUpdate(
      videoId,
      { $set: updatedData },
      { new: true }
    ).populate("owner", "username fullName avatar");

    console.log("✅ Video updated successfully:", updatedVideo);

    return res
      .status(200)
      .json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
  } catch (error) {
    console.log("❌❌❌ ERROR IN UPDATE VIDEO ❌❌❌");
    console.log("Error message:", error?.message);
    console.log("Error stack:", error?.stack);
    console.log("Full error:", error);
    throw new ApiErrors(500, error?.message);
  }
});

const deleteVideo = asyncHandler(async (req, res, next) => {
  try {
    const { videoId } = req.params;
    if (!isValidObjectId(videoId)) {
      throw new ApiErrors(400, "Invalid Video Id");
    }
    const video = await Video.findById(videoId);
    if (!video) {
      throw new ApiErrors(404, "Video not exists");
    }
    if (video.owner.toString() !== req.user?._id.toString()) {
      throw new ApiErrors(403, "You Are Not Allowed To Delete This Video");
    }
    await Video.findByIdAndDelete(videoId);
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Video Deleted Successfully"));
  } catch (error) {
    throw new ApiErrors(500, error?.message);
  }
});

const isPublishStatus = asyncHandler(async (req, res, next) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiErrors(400, "Invalid video id");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiErrors(404, "Video not found");
  }

  if (video.owner.toString() !== req.user?._id.toString()) {
    throw new ApiErrors(403, "You are not allowed to publish this video");
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: !video.isPublished,
      },
    },
    { new: true }
  ).select("-__v");
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedVideo,
        `Video ${updatedVideo.isPublished ? "Published" : "UnPublished"}`
      )
    );
});

export {
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  getAllVideos,
  isPublishStatus,
};
