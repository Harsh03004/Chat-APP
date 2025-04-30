import { useState } from "react";
import { X, Users, Settings } from "lucide-react";
import { useGroupStore } from "../store/useGroupStore";
import useAuthStore from "../store/useAuthStore";
import GroupSettingsModal from "./GroupSettingsModal";

const GroupMembersModal = ({ isOpen, onClose, group, onLeaveGroup }) => {
  if (!isOpen || !group) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-base-100 rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Group Members</h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {group.members.map((member) => (
            <div key={member._id} className="flex items-center gap-2 p-2 hover:bg-base-200 rounded-lg">
              <div className="avatar">
                <div className="w-8 rounded-full">
                  <img src={member.profilePic || "/avatar.png"} alt={member.fullName} />
                </div>
              </div>
              <span>{member.fullName}</span>
              {Array.isArray(group.admin) 
                ? group.admin.some(admin => admin._id === member._id) && (
                    <span className="text-xs text-primary">(Admin)</span>
                  )
                : group.admin._id === member._id && (
                    <span className="text-xs text-primary">(Admin)</span>
                  )
              }
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-4">
          <button onClick={onLeaveGroup} className="btn btn-error">
            Leave Group
          </button>
        </div>
      </div>
    </div>
  );
};

const GroupHeader = () => {
  const { selectedGroup, setSelectedGroup, removeGroupMember } = useGroupStore();
  const { authUser } = useAuthStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMembersOpen, setIsMembersOpen] = useState(false);

  const isAdmin = Array.isArray(selectedGroup?.admin) 
    ? selectedGroup.admin.some(admin => admin._id === authUser._id)
    : selectedGroup?.admin?._id === authUser._id;

  const handleLeaveGroup = async () => {
    await removeGroupMember(selectedGroup._id, authUser._id);
    setIsMembersOpen(false);
    setSelectedGroup(null);
  };

  return (
    <>
      <div className="p-2.5 border-b border-base-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Group Avatar */}
            <div className="avatar">
              <div className="size-10 rounded-full relative">
                <img
                  src={selectedGroup.groupPic || "/group-avatar.png"}
                  alt={selectedGroup.name}
                />
              </div>
            </div>

            {/* Group info */}
            <div>
              <h3 className="font-medium">
                {selectedGroup.name}
              </h3>
              <p className="text-sm text-base-content/70">
                {selectedGroup.members.length} members
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMembersOpen(true)}
              className="btn btn-ghost btn-sm"
            >
              <Users size={20} />
            </button>
            {isAdmin && (
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="btn btn-ghost btn-sm"
              >
                <Settings size={20} />
              </button>
            )}
            <button
              onClick={() => setSelectedGroup(null)}
              className="btn btn-ghost btn-sm"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </div>

      <GroupSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
      <GroupMembersModal
        isOpen={isMembersOpen}
        onClose={() => setIsMembersOpen(false)}
        group={selectedGroup}
        onLeaveGroup={handleLeaveGroup}
      />
    </>
  );
};

export default GroupHeader; 