import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// Get all videos
const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);

  let filter = {};

  if (query) {
    filter.title = {
      $regex: query,
      $options: "i",
    };
  }

  if (userId) {
    filter.user = userId;
  }

  const sortOptions = {};
  sortOptions[sortBy] = sortType === "asc" ? 1 : -1;

  try {
    const videos = await Video.find(filter)
      .sort(sortOptions)
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber);

    const totalVideo = await Video.countDocuments(filter);

    res.status(200).json(
      new ApiResponse(200, {
        totalVideo,
        currentPage: pageNumber,
        totalPage: Math.ceil(totalVideo / limitNumber),
        videos,
      })
    );
  } catch (error) {
    throw new ApiError(500, "Failed to fetch videos");
  }
});

// Upload video on Cloudinary
const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  // Debug log: check if title and description are received
  console.log("Received title:", title);
  console.log("Received description:", description);

  if (!title || !description) {
    throw new ApiError(400, "Title and description are required");
  }

  // Check if both videoFile and thumbnail files exist
  if (!req.files || !req.files.videoFile || !req.files.thumbnail) {
    throw new ApiError(400, "Video file and thumbnail are required");
  }

  try {
    const videoLocalPath = req.files.videoFile[0].path;
    const thumbnailLocalPath = req.files.thumbnail[0].path;

    // Upload video to Cloudinary
    const uploadVideo = await uploadOnCloudinary(videoLocalPath);
    const videoDuration = uploadVideo.duration;

    // Upload thumbnail to Cloudinary
    const uploadThumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    // Create new video document
    const video = new Video({
      title,
      description,
      videoFile: uploadVideo.url,
      cloudinaryId: uploadVideo.public_id,
      thumbnail: uploadThumbnail.url,
      duration: videoDuration,
      owner: req.user.id,
    });

    const savedVideo = await video.save();

    res
      .status(201)
      .json(new ApiResponse(201, savedVideo, "Video published successfully"));
  } catch (error) {
    throw new ApiError(500, "Failed to upload video");
  }
});

// Get video by ID
const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  try {
    const video = await Video.findById(videoId);

    if (!video) {
      throw new ApiError(404, "Video not found");
    }

    res
      .status(200)
      .json(new ApiResponse(200, video, "Video retrieved successfully"));
  } catch (error) {
    throw new ApiError(500, "Failed to fetch video");
  }
});

// Update video
const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description, thumbnail } = req.body;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  if (!title || !description) {
    throw new ApiError(400, "Title and description are required");
  }

  try {
    const video = await Video.findById(videoId);

    if (!video) {
      throw new ApiError(404, "Video not found");
    }

    video.title = title;
    video.description = description;

    if (req.file) {
      const thumbnailLocalPath = req.file.path;
      const uploadResult = await uploadOnCloudinary(thumbnailLocalPath, {
        folder: "thumbnails",
      });

      video.thumbnail = uploadResult.secure_url;
      video.cloudinaryThumbnailId = uploadResult.public_id;
    }

    const updatedVideo = await video.save();

    res
      .status(200)
      .json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
  } catch (error) {
    throw new ApiError(500, "Failed to update video");
  }
});

// Delete video
const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  try {
    const video = await Video.findById(videoId);

    if (!video) {
      throw new ApiError(404, "Video not found");
    }

    if (video.owner.toString() !== req.user.id) {
      throw new ApiError(403, "You are not authorized to delete this video");
    }

    await cloudinary.uploader.destroy(video.cloudinaryId);
    await video.remove();

    res.status(200).json(new ApiResponse(200, "Video deleted successfully"));
  } catch (error) {
    throw new ApiError(500, "Failed to delete video");
  }
});

// Toggle publish status
const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  try {
    const video = await Video.findById(videoId);

    if (!video) {
      throw new ApiError(404, "Video not found");
    }

    video.published = !video.published;
    const updatedVideo = await video.save();

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          updatedVideo,
          "Publish status updated successfully"
        )
      );
  } catch (error) {
    throw new ApiError(500, "Failed to toggle publish status");
  }
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
