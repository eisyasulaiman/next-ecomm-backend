import express from "express";
import authRouter from "./src/controllers/auth.controllers.js";
import userRouter from "./src/controllers/users.controllers.js";
import auth from "./src/middlewares/auth.js" 
import morgan from "morgan"

const app = express()
app.use(express.json())

app.use('/users', userRouter);
app.use('/sign-in', authRouter);
app.use(morgan('combined'))

app.get('/protected', auth, (req, res) => {
    res.json({ "hello": "world" })
  })

export default app;