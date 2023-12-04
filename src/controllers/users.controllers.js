import express from 'express'
import bcrypt from "bcryptjs"
import { Prisma } from "@prisma/client"
import prisma from "../utils/prisma.js"
import { validateUser } from "../validators/users.js"
import { filter } from "../utils/common.js"
import cors from 'cors'
import bodyParser from 'body-parser';

const router = express.Router()

const app = express();

app.use(cors());
app.use(bodyParser.json());

router.post('/', async (req, res) => {
  const { name, email, password } = req.body;

  // Validate input
  const validationErrors = validateUser({ name, email, password });

  if (Object.keys(validationErrors).length !== 0) {
    return res.status(400).json({
      error: validationErrors
    });
  }

  const hashedPassword = bcrypt.hashSync(password, 8);

  // Create user
  try {
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,  // Store the hashed password in the database
      },
    });

    // Filter and return user
    const filteredUser = filter(newUser, 'id', 'name', 'email');
   
    res.json(filteredUser);
    
  } catch (err) {
    // Handle Prisma error
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      const formattedError = {};
      formattedError[`${err.meta.target[0]}`] = 'already taken';
      return res.status(500).json({ error: formattedError });
    }

    // Send generic error response
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router