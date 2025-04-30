import Group from "../models/group.model.js";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const createGroup = async (req, res) => {
  try {
    const { name, description, groupPic, members } = req.body;
    const adminId = req.user._id;

    if (!name) {
      return res.status(400).json({ message: "Group name is required" });
    }

    // Prevent duplicate group name for the same admin
    const existingGroup = await Group.findOne({ name, admin: adminId });
    if (existingGroup) {
      return res.status(400).json({ message: "A group with this name already exists." });
    }

    let groupPicUrl = "";
    if (groupPic) {
      const uploadResponse = await cloudinary.uploader.upload(groupPic);
      groupPicUrl = uploadResponse.secure_url;
    }

    const newGroup = new Group({
      name,
      description,
      groupPic: groupPicUrl,
      admin: [adminId], // Initialize admin as an array
      members: [...members, adminId], // Include admin in members
    });

    await newGroup.save();

    // Populate admin and members information before sending response
    const populatedGroup = await Group.findById(newGroup._id)
      .populate("admin", "fullName profilePic")
      .populate("members", "fullName profilePic");

    res.status(201).json(populatedGroup);
  } catch (error) {
    console.log("Error in createGroup controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getGroups = async (req, res) => {
  try {
    const userId = req.user._id;
    const groups = await Group.find({ members: userId })
      .populate("admin", "fullName profilePic")
      .populate("members", "fullName profilePic");

    res.status(200).json(groups);
  } catch (error) {
    console.log("Error in getGroups controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const messages = await Message.find({ groupId, messageType: "group" })
      .populate("senderId", "fullName profilePic");

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getGroupMessages controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const sendGroupMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { groupId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      groupId,
      text,
      image: imageUrl,
      messageType: "group",
    });

    await newMessage.save();

    // Populate sender information
    const populatedMessage = await Message.findById(newMessage._id)
      .populate("senderId", "fullName profilePic");

    // Get group members to send message to
    const group = await Group.findById(groupId);
    const memberSocketIds = group.members
      .filter(memberId => memberId.toString() !== senderId.toString())
      .map(memberId => getReceiverSocketId(memberId.toString()));

    // Emit message to all group members
    memberSocketIds.forEach(socketId => {
      if (socketId) {
        io.to(socketId).emit("newGroupMessage", populatedMessage);
      }
    });

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.log("Error in sendGroupMessage controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, description, groupPic } = req.body;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if the requester is an admin
    const isRequesterAdmin = Array.isArray(group.admin)
      ? group.admin.some(admin => admin.toString() === userId.toString())
      : group.admin.toString() === userId.toString();

    if (!isRequesterAdmin) {
      return res.status(403).json({ message: "Only admin can update group" });
    }

    let groupPicUrl = group.groupPic;
    if (groupPic) {
      const uploadResponse = await cloudinary.uploader.upload(groupPic);
      groupPicUrl = uploadResponse.secure_url;
    }

    const updatedGroup = await Group.findByIdAndUpdate(
      groupId,
      {
        name: name || group.name,
        description: description || group.description,
        groupPic: groupPicUrl,
      },
      { new: true }
    ).populate("admin", "fullName profilePic")
     .populate("members", "fullName profilePic");

    res.status(200).json(updatedGroup);
  } catch (error) {
    console.log("Error in updateGroup controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const addGroupMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { memberId } = req.body;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if the requester is an admin
    const isRequesterAdmin = Array.isArray(group.admin)
      ? group.admin.some(admin => admin.toString() === userId.toString())
      : group.admin.toString() === userId.toString();

    if (!isRequesterAdmin) {
      return res.status(403).json({ message: "Only admin can add members" });
    }

    if (group.members.includes(memberId)) {
      return res.status(400).json({ message: "User is already a member" });
    }

    group.members.push(memberId);
    await group.save();

    // Populate the response data
    const updatedGroup = await Group.findById(groupId)
      .populate("admin", "fullName profilePic")
      .populate("members", "fullName profilePic");

    res.status(200).json(updatedGroup);
  } catch (error) {
    console.log("Error in addGroupMember controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const removeGroupMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { memberId } = req.body;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if the requester is an admin
    const isRequesterAdmin = Array.isArray(group.admin)
      ? group.admin.some(admin => admin.toString() === userId.toString())
      : group.admin.toString() === userId.toString();

    if (!isRequesterAdmin) {
      return res.status(403).json({ message: "Only admin can remove members" });
    }

    // Check if trying to remove an admin
    const isMemberAdmin = Array.isArray(group.admin)
      ? group.admin.some(admin => admin.toString() === memberId)
      : group.admin.toString() === memberId;

    if (isMemberAdmin) {
      return res.status(400).json({ message: "Cannot remove admin from group" });
    }

    // Remove member from members array
    group.members = group.members.filter(
      member => member.toString() !== memberId
    );
    await group.save();

    // Populate the response data
    const updatedGroup = await Group.findById(groupId)
      .populate("admin", "fullName profilePic")
      .populate("members", "fullName profilePic");

    res.status(200).json(updatedGroup);
  } catch (error) {
    console.log("Error in removeGroupMember controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (group.admin.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only admin can delete the group" });
    }

    // Delete all messages associated with the group
    await Message.deleteMany({ groupId, messageType: "group" });
    
    // Delete the group
    await Group.findByIdAndDelete(groupId);

    res.status(200).json({ message: "Group deleted successfully" });
  } catch (error) {
    console.log("Error in deleteGroup controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const makeAdmin = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { memberId } = req.body;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if the requester is an admin
    const isRequesterAdmin = Array.isArray(group.admin)
      ? group.admin.some(admin => admin.toString() === userId.toString())
      : group.admin.toString() === userId.toString();

    if (!isRequesterAdmin) {
      return res.status(403).json({ message: "Only admin can make others admin" });
    }

    // Check if the member exists in the group
    if (!group.members.includes(memberId)) {
      return res.status(400).json({ message: "User is not a member of this group" });
    }

    // Convert admin to array if it's not already
    if (!Array.isArray(group.admin)) {
      group.admin = [group.admin];
    }

    // Check if member is already an admin
    if (group.admin.some(admin => admin.toString() === memberId)) {
      return res.status(400).json({ message: "User is already an admin" });
    }

    // Add the member as an admin
    group.admin.push(memberId);
    await group.save();

    // Get user information for the message
    const [newAdmin, requester] = await Promise.all([
      User.findById(memberId).select("fullName"),
      User.findById(userId).select("fullName")
    ]);

    // Create system message for admin promotion
    const systemMessage = new Message({
      senderId: userId,
      groupId,
      text: `${newAdmin.fullName} is now an admin`,
      messageType: "group",
      isSystemMessage: true
    });

    await systemMessage.save();

    // Create personalized message for the new admin
    const personalMessage = new Message({
      senderId: userId,
      groupId,
      text: "You are now an admin",
      messageType: "group",
      isSystemMessage: true
    });

    await personalMessage.save();

    // Get group members to send message to
    const memberSocketIds = group.members
      .map(memberId => getReceiverSocketId(memberId.toString()));

    // Emit general message to all group members except the new admin
    memberSocketIds.forEach(socketId => {
      if (socketId && socketId !== getReceiverSocketId(memberId.toString())) {
        io.to(socketId).emit("newGroupMessage", systemMessage);
      }
    });

    // Emit personal message only to the new admin
    const newAdminSocketId = getReceiverSocketId(memberId.toString());
    if (newAdminSocketId) {
      io.to(newAdminSocketId).emit("newGroupMessage", personalMessage);
    }

    // Populate admin and members information before sending response
    const updatedGroup = await Group.findById(groupId)
      .populate("admin", "fullName profilePic")
      .populate("members", "fullName profilePic");

    res.status(200).json(updatedGroup);
  } catch (error) {
    console.log("Error in makeAdmin controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const removeAdmin = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { memberId } = req.body;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if the requester is an admin
    const isRequesterAdmin = Array.isArray(group.admin)
      ? group.admin.some(admin => admin.toString() === userId.toString())
      : group.admin.toString() === userId.toString();

    if (!isRequesterAdmin) {
      return res.status(403).json({ message: "Only admin can remove admin status" });
    }

    // Prevent removing the last admin
    if (Array.isArray(group.admin) && group.admin.length === 1) {
      return res.status(400).json({ message: "Cannot remove the last admin" });
    }

    // Convert admin to array if it's not already
    if (!Array.isArray(group.admin)) {
      group.admin = [group.admin];
    }

    // Check if target user is actually an admin
    if (!group.admin.some(admin => admin.toString() === memberId)) {
      return res.status(400).json({ message: "User is not an admin" });
    }

    // Get user information before removing admin status
    const [removedAdmin, requester] = await Promise.all([
      User.findById(memberId).select("fullName"),
      User.findById(userId).select("fullName")
    ]);

    // Remove the admin status
    group.admin = group.admin.filter(admin => admin.toString() !== memberId);
    await group.save();

    // Create system message for admin removal
    const systemMessage = new Message({
      senderId: userId,
      groupId,
      text: `${removedAdmin.fullName} is no longer an admin`,
      messageType: "group",
      isSystemMessage: true
    });

    await systemMessage.save();

    // Create personalized message for the removed admin
    const personalMessage = new Message({
      senderId: userId,
      groupId,
      text: "You are no longer an admin",
      messageType: "group",
      isSystemMessage: true
    });

    await personalMessage.save();

    // Get group members to send message to
    const memberSocketIds = group.members
      .map(memberId => getReceiverSocketId(memberId.toString()));

    // Emit general message to all group members except the removed admin
    memberSocketIds.forEach(socketId => {
      if (socketId && socketId !== getReceiverSocketId(memberId.toString())) {
        io.to(socketId).emit("newGroupMessage", systemMessage);
      }
    });

    // Emit personal message only to the removed admin
    const removedAdminSocketId = getReceiverSocketId(memberId.toString());
    if (removedAdminSocketId) {
      io.to(removedAdminSocketId).emit("newGroupMessage", personalMessage);
    }

    // Populate admin and members information before sending response
    const updatedGroup = await Group.findById(groupId)
      .populate("admin", "fullName profilePic")
      .populate("members", "fullName profilePic");

    res.status(200).json(updatedGroup);
  } catch (error) {
    console.log("Error in removeAdmin controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Add a migration function to fix existing groups
export const migrateGroups = async () => {
  try {
    const groups = await Group.find({ admin: { $type: 'objectId' } });
    
    for (const group of groups) {
      group.admin = [group.admin];
      await group.save();
      console.log(`Migrated group ${group._id} to use admin array`);
    }
  } catch (error) {
    console.log("Error migrating groups:", error.message);
  }
};

// Call migration when server starts
migrateGroups();

export const getGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId)
      .populate("admin", "fullName profilePic")
      .populate("members", "fullName profilePic");

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if the user is a member of the group
    if (!group.members.some(member => member._id.toString() === userId.toString())) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    res.status(200).json(group);
  } catch (error) {
    console.log("Error in getGroup controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}; 