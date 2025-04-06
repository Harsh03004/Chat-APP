import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL = "http://localhost:5001"

const useAuthStore = create((set, get) => ({
    authUser: null,
    isCheckingAuth: true,
    isLoggingIn: false,
    isUpadtingProfile: false,
    isCheckingAuth: true,
    onlineUsers: [],
    sokcet: null,

    checkAuth: async () => {
        try {
            const res = await axiosInstance.get("/auth/check");
            set({ authUser: res.data });
            //this part as well
            get().connectSocket()
        } catch (error) {
            console.log("Error in check auth", error);
            set({ authUser: null });
        } finally {
            set({ isCheckingAuth: false });
        }
    },

    signup: async (data) => {
        set({ isSigningUp: true });

        try {
            const res = await axiosInstance.post("/auth/signup", data);
            set({ authUser: res.data });
            toast.success("Account created successfully");

            //this part as well
            get().connectSocket()
        } catch (error) {
            console.error("Signup Error:", error.response?.data || error.message);
            toast.error("Error logging in");

        } finally {
            set({ isSigningUp: false });
        }
    },

    logout: async () => {
        try {
            await axiosInstance.post("/auth/logout");
            set({ authUser: null });
            toast.success("Logged out successfully");
            //also this part 
            get.disconnectSocket()
        } catch (error) {
            toast.error(error.response.data.message);
        }
    },

    login: async (data) => {
        set({ isLoggingIn: true });

        try {
            const res = await axiosInstance.post("/auth/login", data);
            set({ authUser: res.data });
            toast.success("Logged in successfully");
            //this part as well
            get().connectSocket()
        } catch (error) {
            toast.error("Error logging in");
        } finally {
            set({ isLoggingIn: true });
        }
    },

    updateProfile: async (data) => {
        set({ isUpadtingProfile: true });
        try {
            const res = await axiosInstance.put("/auth/update-profile", data);
            set({ authUser: res.data });
            toast.success("Profile updated successfully");
        } catch (error) {
            console.log("error in update profile:", error);
            toast.error(error.response.data.message);
        } finally {
            set({ isUpadtingProfile: false });
        }
    },

    //this part as well
    connectSocket: () => {
        const { authUser } = get();
        if (!authUser || get().socket?.connected) return;

        const socket = io(BASE_URL, {
            query: {
                userId: authUser._id,
            },
        });
        socket.connect();

        set({ socket: socket });

        socket.on("getOnlineUsers", (userId) => {
            set({ onlineUsers: userId });
        });
    },

    disconnectSocket: () => {
        if (get().socket?.connected) get().socket.disconnect();
    },
}));


export default useAuthStore