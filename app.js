import express from "express";
import prisma from "./src/utils/prisma.js";
import {signAccessToken} from "./src/utils/jwt.js";
import { Prisma, PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import bodyParser from 'body-parser';
import cors from 'cors';
// import {filter } from "./src/utils/jwt.js";

const app = express();
app.use(express.json());

app.use(bodyParser.json()) 
app.use(cors())// for parsing application/json

// const port = process.env.PORT || 8080; not used for test

// Filtering function
function filter(obj, ...keys) {
  return keys.reduce((a, c) => ({ ...a, [c]: obj[c] }), {});
}

// Validation function for sign up
export function validateUser(input) {
  const validationErrors = {}

  if (!input || !('name' in input) || !input['name'] || input['name'].length == 0) {
    validationErrors['name'] = 'cannot be blank'
  }

  if (!input?.email || input.email.length === 0) {
    validationErrors.email = 'cannot be blank';
  }
  
  if (!input?.password || input.password.length === 0) {
    validationErrors.password = 'cannot be blank';
  }
  
  if (input?.password && input.password.length < 8) {
    validationErrors.password = 'should be at least 8 characters';
  }
  
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  if (input?.email && !emailRegex.test(input.email)) {
    validationErrors.email = 'is invalid';
  }

  return validationErrors
}
// for login auth
export function validateLogin(input) {
  const validationErrors = {}

  const email = input ? input['email'] : null;
  const password = input ? input['password'] : null;

  if (!email || email.length == 0) {
    validationErrors['email'] = 'cannot be blank';
  }

  if (!password || password.length == 0) {
    validationErrors['password'] = 'cannot be blank';
  }
  
  if (email && !email.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)) {
    validationErrors['email'] = 'is invalid';
  }

  return validationErrors
}

// for sign up
app.post('/users', async (req, res) => {
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

// for login
app.post('/sign-in', async (req, res) => {
  const { email, password } = req.body;

  // Validate input USE PW
  const validationErrors = validateLogin({ email, password });

  if (Object.keys(validationErrors).length !== 0) {
    return res.status(400).json({
      error: validationErrors
    });
  }

  //searches the database for a user based on the email
  const user = await prisma.user.findUnique({
    where: {
      email: email
    }
  })

  console.log(user)

  //if the user is not found, return an error
  if (!user) {
    return res.status(401).json({
      error: {
        email: ' Email address or password not valid'
      }
    });
  }

  //to check if password is correct
  const checkPassword = bcrypt.compareSync(password, user.password);
  if (!checkPassword) {
    return res.status(401).send({
      error: {
        email: ' Email address or password not valid'
      }
    });
  }

  const filteredUser = filter(user, 'id', 'name', 'email');
  const accesstoken = await signAccessToken(filteredUser);
  return res.json({ accesstoken });
 });


// // for getting all users
// app.listen(port, function (err) {
//   if (err) console.log(err);
//   console.log(`Server listening on PORT ${port}`);
// });

export default app