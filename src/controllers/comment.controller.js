import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Like } from "../models/like.model.js";
import { video as Video } from "../models/video.model.js";
import { user as User } from "../models/user.model.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const addComment = asyncHandler(async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      throw new ApiErrors(400, "Content is required");
    }
    if (content.trim() === "") {
      throw new ApiErrors(400, "Content cannot be empty");
    }
    const { videoId } = req.params;
    if (!isValidObjectId(videoId)) {
      throw new ApiErrors(400, "Invalid Video Id");
    }
    const video = await Video.findById(videoId);
    if (!video) {
      throw new ApiErrors(404, "Video not found");
    }
    const newComment = await Comment.create({
      content,
      video: videoId,
      owner: req.user?._id,
    });
    return res
      .status(201)
      .json(new ApiResponse(201, newComment, "Comment Added Successfully"));
  } catch (error) {
    throw new ApiErrors(500, error?.message);
  }
});

const deleteComment = asyncHandler(async (req, res) => {
  try {
    const { commentId } = req.params;
    if (!isValidObjectId(commentId)) {
      throw new ApiErrors(400, "Invalid comment id");
    }
    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw new ApiErrors(404, "Comment not found");
    }
    // Authorization Step
    if (comment.owner.toString() !== req.user?._id.toString()) {
      throw new ApiErrors(403, "You are not allowed to delete this comment");
    }
    await Comment.findByIdAndDelete(commentId);
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Comment deleted successfully"));
  } catch (error) {
    throw new ApiErrors(500, error?.message);
  }
});

const updateComment = asyncHandler(async (req, res) => {
  try {
    const { commentId } = req.params;
    if (!isValidObjectId(commentId)) {
      throw new ApiErrors(400, "Invalid comment id");
    }
    const { content } = req.body;
    if (!content) {
      throw new ApiErrors(400, "Content is required");
    }
    if (content.trim() === "") {
      throw new ApiErrors(400, "Content cannot be empty");
    }
    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw new ApiErrors(404, "Comment not found");
    }
    const owner = comment.owner.toString();
    if (owner !== req.user?._id.toString()) {
      throw new ApiErrors(403, "You are not authorized to update this comment");
    }
    const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      {
        $set: {
          content: content.trim(),
          owner: req.user?._id,
        },
      },
      { new: true }
    );
    return res
      .status(200)
      .json(
        new ApiResponse(200, updatedComment, "Comment updated successfully")
      );
  } catch (error) {
    throw new ApiErrors(500, error?.message);
  }
});

const getAllComments = asyncHandler(async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      videoId,
      query,
      sortBy,
      sortType,
    } = req.query;
    const filter = {};
    if (videoId) {
      if (!isValidObjectId(videoId)) {
        throw new ApiErrors(400, "Invalid video id");
      }
      filter.video = videoId;
    }
    if (query) {
      filter.content = { $regex: query, $options: "i" };
    }
    const sort = {};
    if (sortBy) {
      sort[sortBy] = sortType === "desc" ? -1 : 1;
    } else {
      sort.createdAt = -1;
    }
    const skip = (page - 1) * limit;
    const comments = await Comment.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("owner", "username fullName avatar");
    const totalComments = await Comment.countDocuments(filter);
    const totalPages = Math.ceil(totalComments / limit);
    const currentPage = parseInt(page);
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          comments,
          totalComments,
          totalPages,
          currentPage,
        },
        "All comments fetched successfully"
      )
    );
  } catch (error) {
    throw new ApiErrors(500, error?.message);
  }
});

export { addComment, deleteComment, updateComment, getAllComments };
