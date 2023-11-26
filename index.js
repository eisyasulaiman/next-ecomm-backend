import express from "express";
import prisma from "./src/utils/prisma.js";
import { Prisma, PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const app = express();
const port = process.env.PORT || 8080;

// Filtering function
function filter(obj, ...keys) {
  return keys.reduce((a, c) => ({ ...a, [c]: obj[c] }), {});
}

// Validation function
function validateUser(input) {
  const validationErrors = {};

  if (!('name' in input) || input['name'].length === 0) {
    validationErrors['name'] = 'cannot be blank';
  }

  if (!('email' in input) || input['email'].length === 0) {
    validationErrors['email'] = 'cannot be blank';
  } else if (!input['email'].match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)) {
    validationErrors['email'] = 'is invalid';
  }

  if (!('password' in input) || input['password'].length === 0) {
    validationErrors['password'] = 'cannot be blank';
  } else if (input['password'].length < 8) {
    validationErrors['password'] = 'should be at least 8 characters';
  }

  return validationErrors;
}

app.post('/users', async (req, res) => {
  const { name, email, password } = req.body;

  // Hash the password using bcrypt
  const hashedPassword = bcrypt.hashSync(password, 8);

  // Validate input
  const validationErrors = validateUser({ name, email, password: hashedPassword });

  if (Object.keys(validationErrors).length !== 0) {
    return res.status(400).json({
      error: validationErrors
    });
  }

  // Create user
  try {
    const newUser = await prisma.User.create({
      data: {
        name,
        email,
        password: hashedPassword,  // Store the hashed password in the database
      },
    });

    console.log(newUser);
    
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

    // Log unknown errors
    console.error(err);

    // Send generic error response
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, function (err) {
  if (err) console.log(err);
  console.log(`Server listening on PORT ${port}`);
});
