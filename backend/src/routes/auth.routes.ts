import bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';
import express from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { isAuthenticated, type RequestWithPayload } from '../middleware/jwt.middleware.ts';
import { User } from '../models/User.model.ts';

const router = express.Router();
const saltRounds = 10;

// Zod Schemas
const signupSchema = z.object({
  email: z.string().email({ message: 'Provide a valid email address.' }).trim(),
  password: z
    .string()
    .min(6, { message: 'Password must have at least 6 characters.' })
    .regex(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])/, {
      message: 'Password must contain one number, one lowercase and one uppercase letter.',
    }),
  name: z.string().min(1, { message: 'Name is required.' }).trim(),
});

const loginSchema = z.object({
  email: z.string().email().trim(),
  password: z.string(),
});

// POST /auth/signup
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const validation = signupSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({ message: validation.error.errors[0].message });
      return;
    }

    const { email, password, name } = validation.data;
    const lowerEmail = email.toLowerCase();

    const foundUser = await User.findOne({ email: lowerEmail });

    if (foundUser) {
      res.status(400).json({ message: 'User already exists.' });
      return;
    }

    const salt = bcrypt.genSaltSync(saltRounds);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const createdUser = await User.create({
      email: lowerEmail,
      name,
      password: hashedPassword,
    });

    const { email: userEmail, name: userName, _id } = createdUser;
    const user = { email: userEmail, name: userName, _id };

    res.status(201).json({ user: user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// POST /auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const validation = loginSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({ message: 'Provide valid email and password.' });
      return;
    }

    const { email, password } = validation.data;
    const lowerEmail = email.toLowerCase();

    const foundUser = await User.findOne({ email: lowerEmail });

    if (!foundUser) {
      res.status(401).json({ message: 'User not found.' });
      return;
    }

    const passwordCorrect = bcrypt.compareSync(password, foundUser.password as string);

    if (passwordCorrect) {
      const { _id, email, name } = foundUser;
      const payload = { _id, email, name };

      const authToken = jwt.sign(payload, process.env.TOKEN_SECRET as string, {
        algorithm: 'HS256',
        expiresIn: '6h',
      });

      res.status(200).json({ authToken: authToken });
    } else {
      res.status(401).json({ message: 'Unable to authenticate the user' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// GET /auth/verify
router.get('/verify', isAuthenticated, (req: RequestWithPayload, res: Response) => {
  console.log(`req.payload`, req.payload);
  res.status(200).json(req.payload);
});

export default router;
