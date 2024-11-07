import express from "express";
import {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
} from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

// Get all videos
router.get("/", getAllVideos);

// Get a single video by ID
router.get("/:videoId", getVideoById);

router.post(
  "/",
  verifyJWT, // Check if the user is authenticated
  upload.fields([
    { name: "videoFile", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  publishAVideo
);

// Update a video by ID (authentication and optional thumbnail upload)
router.put(
  "/:videoId",
  verifyJWT,
  upload.single("thumbnail"), // Thumbnail upload (if provided)
  updateVideo
);

// Delete a video by ID (authentication required)
router.delete("/:videoId", verifyJWT, deleteVideo);

// Toggle publish status of a video (authentication required)
router.patch("/:videoId/toggle-publish", verifyJWT, togglePublishStatus);

export default router;
