import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { Tweet } from "../models/tweet.model.js";
import { video as Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  try {
    const { videoId } = req.params;
    if (!isValidObjectId(videoId)) {
      throw new ApiErrors(400, "Invalid Video Id");
    }
    const video = await Video.findById(videoId);
    if (!video) {
      throw new ApiErrors(404, "Video Not Found");
    }
    const existingLike = await Like.findOne({
      video: videoId,
      likedBy: req.user?._id,
    });
    if (existingLike) {
      await Like.findByIdAndDelete(existingLike._id);
      return res
        .status(200)
        .json(new ApiResponse(200, {}, "Video Unliked Successfully"));
    } else {
      const newLike = await Like.create({
        video: videoId,
        likedBy: req.user?._id,
      });
      return res
        .status(200)
        .json(new ApiResponse(200, newLike, "Video Liked Successfully"));
    }
  } catch (error) {
    throw new ApiErrors(500, error?.message);
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  try {
    const { commentId } = req.params;
    if (!isValidObjectId(commentId)) {
      throw new ApiErrors(400, "Invalid Comment Id");
    }
    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw new ApiErrors(404, "Comment Not Found");
    }
    const existingLike = await Like.findOne({
      comment: commentId,
      likedBy: req.user?._id,
    });
    if (existingLike) {
      await Like.findByIdAndDelete(existingLike._id);
      return res
        .status(200)
        .json(new ApiResponse(200, {}, "Comment Unliked Successfully"));
    } else {
      const newLike = await Like.create({
        comment: commentId,
        likedBy: req.user?._id,
      });
      return res
        .status(200)
        .json(new ApiResponse(200, newLike, "Comment Liked Successfully"));
    }
  } catch (error) {
    throw new ApiErrors(500, error?.message);
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  try {
    const { tweetId } = req.params;
    if (!isValidObjectId(tweetId)) {
      throw new ApiErrors(400, "Invalid Tweet Id");
    }
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
      throw new ApiErrors(404, "Tweet Not Found");
    }
    const existingLike = await Like.findOne({
      tweet: tweetId,
      likedBy: req.user?._id,
    });
    if (existingLike) {
      await Like.findByIdAndDelete(existingLike._id);
      return res.status(200).json(new ApiResponse(200, {}, "Tweet Unliked"));
    } else {
      const newLike = await Like.create({
        tweet: tweetId,
        likedBy: req.user?._id,
      });
      return res.status(200).json(new ApiResponse(200, newLike, "Tweet Liked"));
    }
  } catch (error) {
    throw new ApiErrors(500, error?.message);
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy,
      sortType = "desc",
      userId,
    } = req.query;

    const filter = {
      video: { $exists: true, $ne: null }, // Only video likes
    };

    if (userId) {
      if (!isValidObjectId(userId)) {
        throw new ApiErrors(400, "Invalid User Id");
      }
      filter.likedBy = userId;
    } else {
      // If no userId provided, use current user
      filter.likedBy = req.user?._id;
    }

    const sort = {};
    if (sortBy) {
      sort[sortBy] = sortType === "desc" ? -1 : 1;
    } else {
      sort.createdAt = -1;
    }

    const skip = (page - 1) * limit;

    const likes = await Like.find(filter)
      .populate("video") // Populate video details
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const totalLikes = await Like.countDocuments(filter);
    const totalPages = Math.ceil(totalLikes / limit);
    const currentPage = parseInt(page);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          likes,
          totalLikes,
          totalPages,
          currentPage,
        },
        "liked videos fetched successfully"
      )
    );
  } catch (error) {
    throw new ApiErrors(500, error?.message);
  }
});

export { toggleVideoLike, toggleCommentLike, toggleTweetLike, getLikedVideos };
