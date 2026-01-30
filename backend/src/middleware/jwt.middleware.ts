import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

// Extend Express Request type to include payload
export interface RequestWithPayload extends Request {
  payload?: any;
}

export const isAuthenticated = (
  req: RequestWithPayload,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>

    if (token) {
      const payload = jwt.verify(token, process.env.TOKEN_SECRET as string);
      req.payload = payload;
      next();
    } else {
      res.status(401).json({ message: 'Token not provided' });
    }
  } catch (_error) {
    res.status(401).json({ message: 'Token not valid' });
  }
};
