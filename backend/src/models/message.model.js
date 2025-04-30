//Should be a part of the main code

import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },

        groupId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Group",
        },

        text: {
            type: String,
        },

        image: {
            type: String,
        },

        messageType: {
            type: String,
            enum: ["direct", "group"],
            required: true,
        },

        isSystemMessage: {
            type: Boolean,
            default: false,
        }
    }, { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;