import express from "express"
import prisma from "./src/utils/prisma.js"
import { Prisma, PrismaClient } from '@prisma/client'

const app = express()
const port = process.env.PORT || 8080

app.use(express.json())
app.get('/', async ( res) => {
  const allUsers = await prisma.User.findMany()
  res.json(allUsers) 
})

app.post('/users', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const newUser = await prisma.User.create({
      data: { name, email, password },
    });
  
    console.log(newUser);

    res.json(newUser);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      const formattedError = {};
      formattedError[`${err.meta.target[0]}`] = 'already taken';

      return res.status(500).json({
        error: formattedError
      });  // friendly error handling
    }

    // to log it for debugging purposes
    console.error(err);

    // Send a generic error response
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, function (err) {
  if (err) console.log(err);
  console.log(`Server listening on PORT ${port}`);
})