import mongoose, { isValidObjectId } from "mongoose";
import { video as Video } from "../models/video.model.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { user as User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";

const getChannelVideos = asyncHandler(async (req, res) => {
  try {
    const { channelId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    if (!isValidObjectId(channelId)) {
      throw new ApiErrors(400, "Invalid Channel Id");
    }
    const channel = await User.findById(channelId);
    if (!channel) {
      throw new ApiErrors(404, "Channel not found");
    }
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    const videos = await Video.find({ owner: channelId })
      .skip(skip)
      .limit(limitNum)
      .populate("owner", "username fullName avatar");
    const totalVideos = await Video.countDocuments({ owner: channelId });
    const totalPages = Math.ceil(totalVideos / limitNum);
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          videos,
          totalPages,
          totalVideos,
          currentPage: pageNum,
        },
        "All videos fetched successfully"
      )
    );
  } catch (error) {
    throw new ApiErrors(500, error?.message);
  }
});

const getChannelStats = asyncHandler(async (req, res) => {
  try {
    const { channelId } = req.params;
    if (!isValidObjectId(channelId)) {
      throw new ApiErrors(400, "Invalid channel id");
    }

    const channel = await User.findById(channelId);
    if (!channel) {
      throw new ApiErrors(404, "Channel not found");
    }

    const subscriberCount = await Subscription.countDocuments({
      channel: channelId,
    });

    const videosCount = await Video.countDocuments({ owner: channelId });

    const channelVideos = await Video.find({ owner: channelId }).select("_id");
    const videoIds = channelVideos.map((video) => video._id);

    const totalLikes = await Like.countDocuments({
      video: { $in: videoIds },
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          totalSubscribers: subscriberCount,
          totalVideos: videosCount,
          totalLikes: totalLikes,
        },
        "Channel stats fetched successfully"
      )
    );
  } catch (error) {
    throw new ApiErrors(500, error?.message);
  }
});
export { getChannelVideos, getChannelStats };
