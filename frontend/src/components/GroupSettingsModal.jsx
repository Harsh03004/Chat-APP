import { useState, useRef } from "react";
import { useGroupStore } from "../store/useGroupStore";
import { useChatStore } from "../store/useChatStore";
import { Image, X, UserPlus, UserMinus, Settings, Users, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import useAuthStore from "../store/useAuthStore";

const GroupSettingsModal = ({ isOpen, onClose }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [groupPic, setGroupPic] = useState(null);
  const [selectedMember, setSelectedMember] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState("general"); // general, members, danger
  const fileInputRef = useRef(null);

  const { selectedGroup, updateGroup, addGroupMember, removeGroupMember, deleteGroup, makeAdmin, removeAdmin } = useGroupStore();
  const { users } = useChatStore();
  const { authUser } = useAuthStore();

  const isAdmin = Array.isArray(selectedGroup?.admin) 
    ? selectedGroup.admin.some(admin => admin._id === authUser._id)
    : selectedGroup?.admin?._id === authUser._id;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setGroupPic(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setGroupPic(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateGroup(selectedGroup._id, {
        name: name || selectedGroup.name,
        description: description || selectedGroup.description,
        groupPic,
      });
      onClose();
    } catch (error) {
      console.error("Error updating group:", error);
    }
  };

  const handleAddMember = async () => {
    if (!selectedMember) {
      toast.error("Please select a member to add");
      return;
    }

    try {
      await addGroupMember(selectedGroup._id, selectedMember);
      setSelectedMember("");
    } catch (error) {
      console.error("Error adding member:", error);
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      await removeGroupMember(selectedGroup._id, memberId);
    } catch (error) {
      console.error("Error removing member:", error);
    }
  };

  const handleDeleteGroup = async () => {
    if (window.confirm("Are you sure you want to delete this group? This action cannot be undone.")) {
      setIsDeleting(true);
      try {
        await deleteGroup(selectedGroup._id);
        onClose();
      } catch (error) {
        console.error("Error deleting group:", error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleMakeAdmin = async (memberId) => {
    try {
      await makeAdmin(selectedGroup._id, memberId);
    } catch (error) {
      console.error("Error making member admin:", error);
    }
  };

  const handleRemoveAdmin = async (memberId) => {
    try {
      await removeAdmin(selectedGroup._id, memberId);
    } catch (error) {
      console.error("Error removing admin status:", error);
    }
  };

  if (!isOpen) return null;

  const availableUsers = users.filter(
    (user) => !selectedGroup.members.some((member) => member._id === user._id)
  );

  const renderGeneralTab = () => (
    <div className="space-y-4">
      {groupPic && (
        <div className="flex items-center gap-2">
          <div className="relative">
            <img
              src={groupPic}
              alt="Group Preview"
              className="w-20 h-20 object-cover rounded-lg"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300
              flex items-center justify-center"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="label">
          <span className="label-text">Group Name</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input input-bordered w-full"
          placeholder={selectedGroup.name}
        />
      </div>

      <div className="space-y-2">
        <label className="label">
          <span className="label-text">Description</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="textarea textarea-bordered w-full"
          placeholder={selectedGroup.description}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <label className="label">
          <span className="label-text">Group Picture</span>
        </label>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleImageChange}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="btn btn-outline w-full gap-2"
        >
          <Image size={20} />
          {groupPic ? "Change Picture" : "Add Picture"}
        </button>
      </div>
    </div>
  );

  const renderMembersTab = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="label">
          <span className="label-text">Add Member</span>
        </label>
        <div className="flex gap-2">
          <select
            value={selectedMember}
            onChange={(e) => setSelectedMember(e.target.value)}
            className="select select-bordered flex-1"
          >
            <option key="default-option" value="">Select a user</option>
            {availableUsers.map((user) => (
              <option key={user._id} value={user._id}>
                {user.fullName}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAddMember}
            className="btn btn-primary"
            disabled={!selectedMember}
          >
            <UserPlus size={20} />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="label">
          <span className="label-text">Members</span>
        </label>
        <div className="max-h-60 overflow-y-auto space-y-2">
          {selectedGroup.members.map((member) => {
            const isUserAdmin = Array.isArray(selectedGroup.admin)
              ? selectedGroup.admin.some(admin => admin._id === member._id)
              : selectedGroup.admin._id === member._id;

            const canRemoveMember = isAdmin && !isUserAdmin && member._id !== authUser._id;
            const canMakeAdmin = isAdmin && !isUserAdmin;
            const canRemoveAdmin = isAdmin && isUserAdmin && member._id !== authUser._id;

            return (
              <div
                key={member._id}
                className="flex items-center justify-between p-2 hover:bg-base-200 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <div className="avatar">
                    <div className="w-8 rounded-full">
                      <img
                        src={member.profilePic || "/avatar.png"}
                        alt={member.fullName}
                      />
                    </div>
                  </div>
                  <span>{member.fullName}</span>
                  {isUserAdmin && (
                    <span className="text-xs text-primary">(Admin)</span>
                  )}
                </div>
                <div className="flex gap-2">
                  {canMakeAdmin && (
                    <button
                      type="button"
                      onClick={() => handleMakeAdmin(member._id)}
                      className="btn btn-ghost btn-sm text-primary"
                    >
                      Make Admin
                    </button>
                  )}
                  {canRemoveAdmin && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAdmin(member._id)}
                      className="btn btn-ghost btn-sm text-error"
                    >
                      Remove Admin
                    </button>
                  )}
                  {canRemoveMember && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(member._id)}
                      className="btn btn-ghost btn-sm"
                    >
                      <UserMinus size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderDangerTab = () => (
    <div className="space-y-4">
      <div className="p-4 bg-error/10 rounded-lg">
        <h3 className="text-lg font-semibold text-error mb-2">Danger Zone</h3>
        <p className="text-sm text-base-content/70 mb-4">
          These actions are irreversible. Please be certain.
        </p>
        {isAdmin && (
          <button
            type="button"
            onClick={handleDeleteGroup}
            className="btn btn-error w-full"
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Group"}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-base-100 rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Group Settings</h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm">
            <X size={20} />
          </button>
        </div>

        <div className="tabs tabs-boxed mb-4">
          <button
            key="general-tab"
            className={`tab ${activeTab === "general" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("general")}
          >
            <Settings size={16} className="mr-2" />
            General
          </button>
          <button
            key="members-tab"
            className={`tab ${activeTab === "members" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("members")}
          >
            <Users size={16} className="mr-2" />
            Members
          </button>
          {isAdmin && (
            <button
              key="danger-tab"
              className={`tab ${activeTab === "danger" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("danger")}
            >
              <AlertTriangle size={16} className="mr-2" />
              Danger
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === "general" && renderGeneralTab()}
          {activeTab === "members" && renderMembersTab()}
          {activeTab === "danger" && renderDangerTab()}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost"
            >
              Cancel
            </button>
            {activeTab === "general" && (
              <button type="submit" className="btn btn-primary">
                Save Changes
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default GroupSettingsModal; 