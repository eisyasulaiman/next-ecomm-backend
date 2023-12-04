import express from "express";
import authRouter from "./src/controllers/auth.controllers.js";
import userRouter from "./src/controllers/users.controllers.js";

const app = express()
app.use(express.json())

app.use('/users', userRouter);
app.use('/sign-in', authRouter);

export default app;