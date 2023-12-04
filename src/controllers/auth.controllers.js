import express from 'express';
import prisma from '../utils/prisma.js';
import { signAccessToken } from '../utils/jwt.js';
import bcrypt from 'bcryptjs';
import { validateLogin } from '../validators/auth.js';
import { filter } from "../utils/common.js"

const router = express.Router();

router.post('/', async (req, res) => {
  const { email, password } = req.body;

  const validationErrors = validateLogin({ email, password })

  if (Object.keys(validationErrors).length !== 0) {
    return res.status(400).json({
      error: validationErrors
    });
  }

  // Search the database for a user based on the email
  const user = await prisma.user.findUnique({
    where: {
      email
    }
  })

  // If the user is not found, return an error
  if (!user) {
    return res.status(401).send({
      error: 'Email address or password not valid'
    });
  }

  // Check if password is correct
  const checkPassword = bcrypt.compareSync(password, user.password);
  if (!checkPassword) return res.status(401).send({
    error: 'Email address or password not valid'
  })

  const userFiltered = filter(user, 'id', 'name', 'email')
  const accessToken = await signAccessToken(userFiltered);
  return res.json({ accessToken });
});

export default router