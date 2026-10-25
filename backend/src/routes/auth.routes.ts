import { type AuthUser, loginSchema, signupSchema } from '@workout-planner/shared';
import bcrypt from 'bcryptjs';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import { env } from '../config/env.ts';
import {
  getAuth,
  isAuthenticated,
  issueSession,
  revokeSession,
} from '../middleware/session.middleware.ts';
import { User } from '../models/User.model.ts';
import { createDemo } from '../services/demo.service.ts';
import { HttpError } from '../utils/http-error.ts';
import { validate } from '../utils/validate.ts';

const router = express.Router();
const saltRounds = 10;

// Compared against when the email is unknown, so both login failures take about as long.
const dummyPasswordHash = bcrypt.hashSync('not-a-real-password', saltRounds);

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please try again in a few minutes.' },
  skip: () => env.NODE_ENV === 'test',
});

function toAuthUser(user: { _id: unknown; email: string; name: string }): AuthUser {
  return { _id: String(user._id), email: user.email, name: user.name };
}

// POST /auth/signup
router.post('/signup', authRateLimit, async (req, res) => {
  const { email, password, name } = validate(signupSchema, req.body);

  if (await User.exists({ email })) {
    throw new HttpError(409, 'An account with this email already exists.');
  }

  const hashedPassword = await bcrypt.hash(password, saltRounds);
  const user = toAuthUser(await User.create({ email, name, password: hashedPassword }));

  await issueSession(res, user);
  res.status(201).json({ user });
});

// POST /auth/login
router.post('/login', authRateLimit, async (req, res) => {
  const { email, password } = validate(loginSchema, req.body);

  const foundUser = await User.findOne({ email }).select('+password');
  const passwordCorrect = await bcrypt.compare(password, foundUser?.password ?? dummyPasswordHash);

  if (!foundUser || !passwordCorrect) {
    throw new HttpError(401, 'Invalid email or password.');
  }

  const user = toAuthUser(foundUser);
  await issueSession(res, user);
  res.json({ user });
});

// GET /auth/verify
router.get('/verify', isAuthenticated, (req, res) => {
  res.json(getAuth(req));
});

const demoRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
  message: { message: 'Too many demo accounts. Please try again later.' },
});
router.post('/demo', demoRateLimit, async (req, res) => {
  if (!env.DEMO_ENABLED) throw new HttpError(404, 'Demo is disabled.');
  const user = await createDemo();
  await revokeSession(req, res);
  await issueSession(res, user);
  res.status(201).json({ user });
});

router.post('/logout', async (req, res) => {
  await revokeSession(req, res);
  res.status(204).end();
});

export default router;
