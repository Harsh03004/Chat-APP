import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import { Buffer } from 'buffer';

import authRoutes from "./routes/auth.route.js";
//this here
import messageRoutes from "./routes/message.route.js";
import {app,server} from "./lib/socket.js";

import {connectDB} from "./lib/db.js";

//window.Buffer = Buffer;


dotenv.config()
const PORT=process.env.PORT;


app.use(express.json());

app.use(cors({
    origin:"http://localhost:5173",
    credentials:true
}
));

app.use(cookieParser());


app.use("/api/auth",authRoutes);
//this here
app.use("/api/messages",messageRoutes);

server.listen(PORT,()=>  {
    console.log("Server is running on port: "+PORT);
    connectDB();
})