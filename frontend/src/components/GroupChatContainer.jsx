import { useEffect, useRef } from "react";
import { useGroupStore } from "../store/useGroupStore";
import useAuthStore from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import GroupHeader from "./GroupHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";

const GroupChatContainer = () => {
  const {
    groupMessages,
    getGroupMessages,
    isGroupMessagesLoading,
    selectedGroup,
    subscribeToGroupMessages,
    unsubscribeFromGroupMessages,
  } = useGroupStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  useEffect(() => {
    if (selectedGroup) {
      getGroupMessages(selectedGroup._id);
      subscribeToGroupMessages();
    }

    return () => unsubscribeFromGroupMessages();
  }, [selectedGroup?._id, getGroupMessages, subscribeToGroupMessages, unsubscribeFromGroupMessages]);

  useEffect(() => {
    if (messageEndRef.current && groupMessages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [groupMessages]);

  if (isGroupMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <GroupHeader />
        <MessageSkeleton />
        <MessageInput isGroup={true} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <GroupHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {groupMessages.map((message) => {
          if (message.isSystemMessage) {
            return (
              <div key={message._id} className="flex justify-center">
                <div className="bg-base-200 text-base-content/70 px-4 py-2 rounded-full text-sm">
                  {message.text}
                </div>
              </div>
            );
          }

          const isOwnMessage = (typeof message.senderId === "string"
            ? message.senderId === authUser._id
            : message.senderId._id === authUser._id);
          const senderProfilePic = isOwnMessage
            ? authUser.profilePic || "/avatar.png"
            : (message.senderId.profilePic || "/avatar.png");
          const senderName = isOwnMessage
            ? authUser.fullName
            : (message.senderId.fullName || "");
          return (
            <div
              key={message._id}
              className={`chat ${isOwnMessage ? "chat-end" : "chat-start"}`}
              ref={messageEndRef}
            >
              <div className="chat-image avatar">
                <div className="size-10 rounded-full border">
                  <img
                    src={senderProfilePic}
                    alt="profile pic"
                  />
                </div>
              </div>
              <div className="chat-header mb-1">
                {!isOwnMessage && (
                  <span className="text-sm font-medium">
                    {senderName}
                  </span>
                )}
                <time className="text-xs opacity-50 ml-1">
                  {formatMessageTime(message.createdAt)}
                </time>
              </div>
              <div className="chat-bubble flex flex-col">
                {message.image && (
                  <img
                    src={message.image}
                    alt="Attachment"
                    className="sm:max-w-[200px] rounded-md mb-2"
                  />
                )}
                {message.text && <p>{message.text}</p>}
              </div>
            </div>
          );
        })}
      </div>

      <MessageInput isGroup={true} />
    </div>
  );
};

export default GroupChatContainer; 