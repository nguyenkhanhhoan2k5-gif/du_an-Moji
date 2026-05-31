import express from "express";

import {
  sendDirectMessage,
  sendGroupMessage,
  sendDirectImageMessage,
  sendGroupImageMessage,
} from "../controllers/messageController.js";
import {
  checkFriendship,
  checkGroupMembership,
} from "../middlewares/friendMiddleware.js";
import { upload } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.post("/direct", checkFriendship, sendDirectMessage);
router.post("/group", checkGroupMembership, sendGroupMessage);

router.post(
  "/direct/image",
  upload.single("file"),
  checkFriendship,
  sendDirectImageMessage,
);

router.post(
  "/group/image",
  upload.single("file"),
  checkGroupMembership,
  sendGroupImageMessage,
);

export default router;
