import { Router } from "express";
import {
  deleteVideo,
  getAllVideos,
  getVideoById,
  isPublishStatus,
  publishAVideo,
  updateVideo,
} from "../controllers/video.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();
router.use(verifyJWT);
router
  .route("/")
  .get(getAllVideos)
  .post(
    upload.fields([
      { name: "videoFile", maxCount: 1 },
      { name: "thumbnail", maxCount: 1 },
    ]),
    publishAVideo
  );

router
  .route("/:videoId")
  .get(getVideoById)
  .patch(
    upload.fields([
      { name: "videoFile", maxCount: 1 },
      { name: "thumbnail", maxCount: 1 },
    ]),
    updateVideo
  )
  .delete(deleteVideo);

router.route("/toggle/publish/:videoId").patch(isPublishStatus);

export default router;
