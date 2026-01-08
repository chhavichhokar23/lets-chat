import express from "express";

import {
  createChatRoom,
  getChatRoomOfUser,
  getChatRoomOfUsers,
} from "../controllers/chatRoom.js";

const router = express.Router();

router.post("/", createChatRoom);
router.get("/:firstUserId/:secondUserId", getChatRoomOfUsers);
router.get("/:userId", getChatRoomOfUser);

export default router;
