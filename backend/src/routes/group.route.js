import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  createGroup,
  getGroups,
  getGroup,
  getGroupMessages,
  sendGroupMessage,
  updateGroup,
  addGroupMember,
  removeGroupMember,
  deleteGroup,
  makeAdmin,
  removeAdmin,
} from "../controllers/group.controller.js";

const router = express.Router();

router.post("/create", protectRoute, createGroup);
router.get("/", protectRoute, getGroups);
router.get("/:groupId", protectRoute, getGroup);
router.get("/:groupId/messages", protectRoute, getGroupMessages);
router.post("/:groupId/messages", protectRoute, sendGroupMessage);
router.put("/:groupId", protectRoute, updateGroup);
router.post("/:groupId/members", protectRoute, addGroupMember);
router.delete("/:groupId/members", protectRoute, removeGroupMember);
router.delete("/:groupId", protectRoute, deleteGroup);
router.post("/:groupId/admins", protectRoute, makeAdmin);
router.delete("/:groupId/admins", protectRoute, removeAdmin);

export default router; 