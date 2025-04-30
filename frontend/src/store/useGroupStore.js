import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import useAuthStore from "./useAuthStore";

export const useGroupStore = create((set, get) => ({
  groups: [],
  selectedGroup: null,
  groupMessages: [],
  isGroupsLoading: false,
  isGroupMessagesLoading: false,

  getGroups: async () => {
    set({ isGroupsLoading: true });
    try {
      const res = await axiosInstance.get("/groups");
      set({ groups: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Error fetching groups");
    } finally {
      set({ isGroupsLoading: false });
    }
  },

  getGroupMessages: async (groupId) => {
    set({ isGroupMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/groups/${groupId}/messages`);
      set({ groupMessages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Error fetching group messages");
    } finally {
      set({ isGroupMessagesLoading: false });
    }
  },

  sendGroupMessage: async (messageData) => {
    const { selectedGroup, groupMessages } = get();
    try {
      const res = await axiosInstance.post(`/groups/${selectedGroup._id}/messages`, messageData);
      set({ groupMessages: [...groupMessages, res.data] });

      // Refresh group data to update members list
      const groupRes = await axiosInstance.get(`/groups/${selectedGroup._id}`);
      set((state) => ({
        groups: state.groups.map((group) =>
          group._id === selectedGroup._id ? groupRes.data : group
        ),
        selectedGroup: groupRes.data,
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Error sending message");
    }
  },

  createGroup: async (groupData) => {
    try {
      const res = await axiosInstance.post("/groups/create", groupData);
      set((state) => ({
        groups: [...state.groups, res.data],
      }));
      toast.success("Group created successfully");
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Error creating group");
      throw error;
    }
  },

  updateGroup: async (groupId, groupData) => {
    try {
      const res = await axiosInstance.put(`/groups/${groupId}`, groupData);
      set((state) => ({
        groups: state.groups.map((group) =>
          group._id === groupId ? res.data : group
        ),
        selectedGroup: state.selectedGroup?._id === groupId ? res.data : state.selectedGroup,
      }));
      toast.success("Group updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error updating group");
    }
  },

  addGroupMember: async (groupId, memberId) => {
    try {
      const res = await axiosInstance.post(`/groups/${groupId}/members`, { memberId });
      set((state) => ({
        groups: state.groups.map((group) =>
          group._id === groupId ? res.data : group
        ),
        selectedGroup: state.selectedGroup?._id === groupId ? res.data : state.selectedGroup,
      }));
      toast.success("Member added successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error adding member");
    }
  },

  removeGroupMember: async (groupId, memberId) => {
    try {
      const res = await axiosInstance.delete(`/groups/${groupId}/members`, {
        data: { memberId },
      });
      set((state) => ({
        groups: state.groups.map((group) =>
          group._id === groupId ? res.data : group
        ),
        selectedGroup: state.selectedGroup?._id === groupId ? res.data : state.selectedGroup,
      }));
      toast.success("Member removed successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error removing member");
    }
  },

  setSelectedGroup: (group) => set({ selectedGroup: group }),

  subscribeToGroupMessages: () => {
    const { selectedGroup } = get();
    if (!selectedGroup) return;

    const socket = useAuthStore.getState().socket;
    socket.emit("joinGroup", selectedGroup._id);

    socket.on("newGroupMessage", (newMessage) => {
      if (newMessage.groupId === selectedGroup._id) {
        set((state) => ({
          groupMessages: [...state.groupMessages, newMessage],
        }));
      }
    });
  },

  unsubscribeFromGroupMessages: () => {
    const { selectedGroup } = get();
    if (!selectedGroup) return;

    const socket = useAuthStore.getState().socket;
    socket.emit("leaveGroup", selectedGroup._id);
    socket.off("newGroupMessage");
  },

  deleteGroup: async (groupId) => {
    try {
      await axiosInstance.delete(`/groups/${groupId}`);
      set((state) => ({
        groups: state.groups.filter((group) => group._id !== groupId),
        selectedGroup: null,
      }));
      toast.success("Group deleted successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error deleting group");
    }
  },

  makeAdmin: async (groupId, memberId) => {
    try {
      const res = await axiosInstance.post(`/groups/${groupId}/admins`, { memberId });
      set((state) => ({
        groups: state.groups.map((group) =>
          group._id === groupId ? res.data : group
        ),
        selectedGroup: state.selectedGroup?._id === groupId ? res.data : state.selectedGroup,
      }));
      toast.success("Member is now an admin");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error making member admin");
    }
  },

  removeAdmin: async (groupId, memberId) => {
    try {
      const res = await axiosInstance.delete(`/groups/${groupId}/admins`, { 
        data: { memberId } 
      });
      set((state) => ({
        groups: state.groups.map((group) =>
          group._id === groupId ? res.data : group
        ),
        selectedGroup: state.selectedGroup?._id === groupId ? res.data : state.selectedGroup,
      }));
      toast.success("Admin status removed successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error removing admin status");
    }
  },
})); 