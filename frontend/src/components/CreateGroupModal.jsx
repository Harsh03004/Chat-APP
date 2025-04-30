import { useState, useRef } from "react";
import { useGroupStore } from "../store/useGroupStore";
import { useChatStore } from "../store/useChatStore";
import { Image, X } from "lucide-react";
import toast from "react-hot-toast";

const CreateGroupModal = ({ isOpen, onClose }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [groupPic, setGroupPic] = useState(null);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const fileInputRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { createGroup } = useGroupStore();
  const { users } = useChatStore();

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

  const handleMemberToggle = (userId) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Group name is required");
      return;
    }

    if (selectedMembers.length === 0) {
      toast.error("Please select at least one member");
      return;
    }

    setIsSubmitting(true);
    try {
      await createGroup({
        name: name.trim(),
        description: description.trim(),
        groupPic,
        members: selectedMembers,
      });
      onClose();
    } catch (error) {
      // Error toast already shown in store
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-base-100 rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Create New Group</h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="Enter group name"
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
              placeholder="Enter group description"
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

          <div className="space-y-2">
            <label className="label">
              <span className="label-text">Select Members</span>
            </label>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {users.map((user) => (
                <label
                  key={user._id}
                  className="flex items-center gap-2 p-2 hover:bg-base-200 rounded-lg cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(user._id)}
                    onChange={() => handleMemberToggle(user._id)}
                    className="checkbox checkbox-sm"
                  />
                  <div className="flex items-center gap-2">
                    <div className="avatar">
                      <div className="w-8 rounded-full">
                        <img
                          src={user.profilePic || "/avatar.png"}
                          alt={user.fullName}
                        />
                      </div>
                    </div>
                    <span>{user.fullName}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal; 