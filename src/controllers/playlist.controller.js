import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { user as User } from "../models/user.model.js";
import { video as Video } from "../models/video.model.js";

import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  try {
    if (!req.user) {
      throw new ApiErrors(401, "Unauthorized");
    }
    const { name, description } = req.body;
    if (!name || !description) {
      throw new ApiErrors(400, "Name and description are required");
    }
    if (name.trim() === "" || description.trim() === "") {
      throw new ApiErrors(400, "Name and description cannot be empty");
    }

    const newPlaylist = await Playlist.create({
      name,
      description,
      owner: req.user?._id,
    });
    return res
      .status(201)
      .json(new ApiResponse(201, newPlaylist, "Playlist Created Successfully"));
  } catch (error) {
    throw new ApiErrors(500, error?.message);
  }
});

const getUserPlaylist = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    if (!isValidObjectId(userId)) {
      throw new ApiErrors(400, "Invalid User Id");
    }
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiErrors(404, "User not found");
    }
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    const playLists = await Playlist.find({ owner: userId })
      .skip(skip)
      .limit(limitNum)
      .populate("owner", "username fullName avatar");
    const totalPlaylists = await Playlist.countDocuments({ owner: userId });
    const totalPages = Math.ceil(totalPlaylists / limitNum);
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          playLists,
          totalPlaylists,
          totalPages,
          currentPage: pageNum,
        },
        "Playlists fetched successfully"
      )
    );
  } catch (error) {
    throw new ApiErrors(500, error?.message);
  }
});

const getPlaylistById = asyncHandler(async (req, res) => {
  try {
    const { playlistId } = req.params;

    if (!isValidObjectId(playlistId)) {
      throw new ApiErrors(400, "Invalid Playlist Id");
    }

    const playlist = await Playlist.findById(playlistId).populate(
      "owner",
      "username fullName avatar"
    );
    if (!playlist) {
      throw new ApiErrors(404, "Playlist not found");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, playlist, "Playlist fetched successfully"));
  } catch (error) {
    throw new ApiErrors(500, error?.message);
  }
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  try {
    const { playlistId } = req.params;
    if (!isValidObjectId(playlistId)) {
      throw new ApiErrors(400, "Invalid Playlist Id");
    }
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      throw new ApiErrors(404, "Playlist not found");
    }
    if (req.user?._id.toString() !== playlist.owner.toString()) {
      throw new ApiErrors(403, "You are unauthorized");
    }
    const { videoId } = req.params;
    if (!isValidObjectId(videoId)) {
      throw new ApiErrors(400, "Invalid Video Id");
    }
    const video = await Video.findById(videoId);
    if (!video) {
      throw new ApiErrors(404, "Video not found");
    }
    if (playlist.videos.includes(videoId)) {
      throw new ApiErrors(400, "Video already exists in playlist");
    }
    const newPlaylist = await Playlist.findByIdAndUpdate(
      playlistId,
      {
        $addToSet: {
          videos: videoId,
        },
      },
      { new: true }
    );
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          newPlaylist,
          "Video added to playlist successfully"
        )
      );
  } catch (error) {
    throw new ApiErrors(500, error?.message);
  }
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  try {
    const { playlistId } = req.params;
    if (!isValidObjectId(playlistId)) {
      throw new ApiErrors(400, "Invalid Playlist Id");
    }
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      throw new ApiErrors(404, "Playlist not found");
    }
    if (playlist.owner.toString() !== req.user?._id.toString()) {
      throw new ApiErrors(403, "You are unauthorized");
    }
    const { videoId } = req.params;
    if (!isValidObjectId(videoId)) {
      throw new ApiErrors(400, "Invalid Video Id");
    }
    const video = await Video.findById(videoId);
    if (!video) {
      throw new ApiErrors(404, "Video not found");
    }
    if (!playlist.videos.includes(videoId)) {
      throw new ApiErrors(400, "Video not found in playlist");
    }
    const newPlaylist = await Playlist.findByIdAndUpdate(
      playlistId,
      {
        $pull: {
          videos: videoId,
        },
      },
      { new: true }
    );
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          newPlaylist,
          "Video removed from playlist successfully"
        )
      );
  } catch (error) {
    throw new ApiErrors(500, error?.message);
  }
});

const deletePlaylist = asyncHandler(async (req, res) => {
  try {
    const { playlistId } = req.params;
    if (!isValidObjectId(playlistId)) {
      throw new ApiErrors(400, "Invalid playlist id");
    }
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      throw new ApiErrors(404, "Playlist not found");
    }
    if (playlist.owner.toString() !== req.user?._id.toString()) {
      throw new ApiErrors(403, "You are unauthorized");
    }
    await Playlist.findByIdAndDelete(playlistId);
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Playlist deleted Successfully"));
  } catch (error) {
    throw new ApiErrors(500, error?.message);
  }
});

const updatePlaylist = asyncHandler(async (req, res) => {
  try {
    const { playlistId } = req.params;

    if (!isValidObjectId(playlistId)) {
      throw new ApiErrors(400, "Invalid Playlist Id");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      throw new ApiErrors(404, "Playlist not found");
    }

    if (playlist.owner.toString() !== req.user?._id.toString()) {
      throw new ApiErrors(403, "You are unauthorized");
    }

    const { name, description } = req.body;
    if (!name && !description) {
      throw new ApiErrors(
        400,
        "At least one field (name or description) is required"
      );
    }

    const updateFields = {};
    if (name?.trim()) {
      updateFields.name = name.trim();
    }
    if (description?.trim()) {
      updateFields.description = description.trim();
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
      playlistId,
      { $set: updateFields },
      { new: true }
    );

    return res
      .status(200)
      .json(
        new ApiResponse(200, updatedPlaylist, "Playlist updated successfully")
      );
  } catch (error) {
    throw new ApiErrors(500, error?.message);
  }
});

const getVideoSavedStatus = asyncHandler(async (req, res) => {
  try {
    const { videoId } = req.params;
    if (!isValidObjectId(videoId)) {
      throw new ApiErrors(400, "Invalid Video Id");
    }
    const video = await Video.findById(videoId);
    if (!video) {
      throw new ApiErrors(404, "Video not found");
    }
    const savedStatus = await Playlist.findOne({
      videos: videoId,
      owner: req.user?._id,
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          isSaved: !!savedStatus,
        },
        "Video saved status fetched successfully"
      )
    );
  } catch (error) {
    throw new ApiErrors(500, error?.message);
  }
});
export {
  createPlaylist,
  getUserPlaylist,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
  getVideoSavedStatus,
};
