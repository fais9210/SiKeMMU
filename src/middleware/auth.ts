import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  user?: unknown;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  return next();
};
