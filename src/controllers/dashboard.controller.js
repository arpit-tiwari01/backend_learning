import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  const { _id: userId } = req.user;

  if (!mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  try {
    // Using Promise.all for parallel execution
    const [videosStats, subscribersCount, likesStats] = await Promise.all([
      // Get video statistics
      Video.aggregate([
        { $match: { owner: new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: null,
            totalVideos: { $sum: 1 },
            totalViews: { $sum: "$views" },
            publishedVideos: {
              $sum: { $cond: [{ $eq: ["$isPublished", true] }, 1, 0] },
            },
            avgDuration: { $avg: "$duration" },
          },
        },
        {
          $project: {
            _id: 0,
            totalVideos: 1,
            totalViews: 1,
            publishedVideos: 1,
            avgDuration: { $round: ["$avgDuration", 2] },
          },
        },
      ]),

      // Get subscribers count
      Subscription.countDocuments({
        channel: new mongoose.Types.ObjectId(userId),
      }),

      // Get likes statistics
      Like.aggregate([
        {
          $lookup: {
            from: "videos",
            localField: "video",
            foreignField: "_id",
            as: "videoDetails",
          },
        },
        { $unwind: "$videoDetails" },
        {
          $match: {
            "videoDetails.owner": new mongoose.Types.ObjectId(userId),
          },
        },
        {
          $group: {
            _id: null,
            totalLikes: { $sum: 1 },
          },
        },
      ]),
    ]);

    const stats = {
      videos: {
        total: videosStats[0]?.totalVideos || 0,
        published: videosStats[0]?.publishedVideos || 0,
        totalViews: videosStats[0]?.totalViews || 0,
        avgDuration: videosStats[0]?.avgDuration || 0,
      },
      subscribers: subscribersCount || 0,
      likes: likesStats[0]?.totalLikes || 0,
    };

    return res
      .status(200)
      .json(
        new ApiResponse(200, stats, "Channel statistics retrieved successfully")
      );
  } catch (error) {
    throw new ApiError(
      500,
      "Error while fetching channel statistics: " + error.message
    );
  }
});

const getChannelVideos = asyncHandler(async (req, res) => {
  const { _id: userId } = req.user;
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = -1,
    isPublished,
    search = "",
    category,
  } = req.query;

  if (!mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  try {
    const matchStage = {
      owner: new mongoose.Types.ObjectId(userId),
    };

    // Add filters
    if (typeof isPublished === "boolean") {
      matchStage.isPublished = isPublished;
    }

    if (category) {
      matchStage.category = category;
    }

    if (search) {
      matchStage.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    const aggregationPipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "ownerDetails",
          pipeline: [
            {
              $project: {
                username: 1,
                avatar: 1,
              },
            },
          ],
        },
      },
      { $unwind: "$ownerDetails" },
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "video",
          as: "likes",
        },
      },
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "video",
          as: "comments",
        },
      },
      {
        $addFields: {
          likesCount: { $size: "$likes" },
          commentsCount: { $size: "$comments" },
        },
      },
      {
        $project: {
          likes: 0,
          comments: 0,
        },
      },
      { $sort: { [sortBy]: parseInt(sortOrder) } },
    ];

    const videos = await Video.aggregatePaginate(
      Video.aggregate(aggregationPipeline),
      {
        page: parseInt(page),
        limit: parseInt(limit),
        customLabels: {
          docs: "videos",
          totalDocs: "totalVideos",
        },
      }
    );

    return res
      .status(200)
      .json(
        new ApiResponse(200, videos, "Channel videos retrieved successfully")
      );
  } catch (error) {
    throw new ApiError(
      500,
      "Error while fetching channel videos: " + error.message
    );
  }
});

const getVideoAnalytics = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { _id: userId } = req.user;

  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  try {
    const video = await Video.findOne({
      _id: videoId,
      owner: userId,
    });

    if (!video) {
      throw new ApiError(404, "Video not found or unauthorized");
    }

    const analytics = await Video.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(videoId),
        },
      },
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "video",
          as: "likes",
        },
      },
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "video",
          as: "comments",
        },
      },
      {
        $project: {
          title: 1,
          views: 1,
          createdAt: 1,
          duration: 1,
          likesCount: { $size: "$likes" },
          commentsCount: { $size: "$comments" },
          engagementRate: {
            $multiply: [
              {
                $divide: [
                  { $add: [{ $size: "$likes" }, { $size: "$comments" }] },
                  { $cond: [{ $eq: ["$views", 0] }, 1, "$views"] },
                ],
              },
              100,
            ],
          },
        },
      },
    ]);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          analytics[0],
          "Video analytics retrieved successfully"
        )
      );
  } catch (error) {
    throw new ApiError(
      500,
      "Error while fetching video analytics: " + error.message
    );
  }
});

export { getChannelStats, getChannelVideos, getVideoAnalytics };
