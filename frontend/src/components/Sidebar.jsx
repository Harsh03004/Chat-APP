import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";
import useAuthStore from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, MessageSquare, Plus } from "lucide-react";
import CreateGroupModal from "./CreateGroupModal";

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();
  const { getGroups, groups, selectedGroup, setSelectedGroup, isGroupsLoading } = useGroupStore();
  const { onlineUsers } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [activeTab, setActiveTab] = useState("direct"); // "direct" or "group"
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);

  useEffect(() => {
    getUsers();
    getGroups();
  }, [getUsers, getGroups]);

  const filteredUsers = showOnlineOnly
    ? users.filter((user) => onlineUsers.includes(user._id))
    : users;

  if (isUsersLoading || isGroupsLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center gap-2">
          <MessageSquare className="size-6" />
          <span className="font-medium hidden lg:block">Chats</span>
        </div>

        {/* Tabs */}
        <div className="mt-3 flex gap-2">
          <button
            className={`btn btn-sm ${activeTab === "direct" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setActiveTab("direct")}
          >
            Direct
          </button>
          <button
            className={`btn btn-sm ${activeTab === "group" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setActiveTab("group")}
          >
            Groups
          </button>
        </div>

        {/* Online filter toggle */}
        <div className="mt-3 hidden lg:flex items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-sm"
            />
            <span className="text-sm">Show online only</span>
          </label>
          <span className="text-xs text-zinc-500">({onlineUsers.length - 1} online)</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "direct" ? (
          // Direct Messages
          <div className="p-2 space-y-2">
            {filteredUsers.map((user) => (
              <button
                key={user._id}
                onClick={() => {
                  setSelectedUser(user);
                  setSelectedGroup(null);
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-base-200 transition-colors
                  ${selectedUser?._id === user._id ? "bg-base-200" : ""}`}
              >
                <div className="avatar">
                  <div className="size-10 rounded-full relative">
                    <img
                      src={user.profilePic || "/avatar.png"}
                      alt={user.fullName}
                    />
                    {onlineUsers.includes(user._id) && (
                      <div className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full border-2 border-base-100" />
                    )}
                  </div>
                </div>
                <div className="hidden lg:block text-left">
                  <h3 className="font-medium">{user.fullName}</h3>
                  <p className="text-sm text-base-content/70">
                    {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          // Groups
          <div className="p-2 space-y-2">
            <button
              onClick={() => setIsCreateGroupModalOpen(true)}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-base-200 transition-colors"
            >
              <div className="avatar">
                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Plus className="size-5 text-primary" />
                </div>
              </div>
              <div className="hidden lg:block text-left">
                <h3 className="font-medium">Create New Group</h3>
              </div>
            </button>

            {groups.map((group) => (
              <button
                key={group._id}
                onClick={() => {
                  setSelectedGroup(group);
                  setSelectedUser(null);
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-base-200 transition-colors
                  ${selectedGroup?._id === group._id ? "bg-base-200" : ""}`}
              >
                <div className="avatar">
                  <div className="size-10 rounded-full">
                    <img
                      src={group.groupPic || "/group-avatar.png"}
                      alt={group.name}
                    />
                  </div>
                </div>
                <div className="hidden lg:block text-left">
                  <h3 className="font-medium">{group.name}</h3>
                  <p className="text-sm text-base-content/70">
                    {group.members.length} members
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <CreateGroupModal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
      />
    </aside>
  );
};

export default Sidebar;