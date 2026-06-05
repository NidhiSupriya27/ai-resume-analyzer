import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { sendUnauthorized, sendForbidden } from '../utils/apiResponse';
import { logger } from '../utils/logger';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendUnauthorized(res, 'No token provided');
      return;
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET || 'fallback-secret';
    const decoded = jwt.verify(token, secret) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    logger.warn('Authentication failed', { error });
    if (error instanceof jwt.TokenExpiredError) {
      sendUnauthorized(res, 'Token expired');
    } else {
      sendUnauthorized(res, 'Invalid token');
    }
  }
}

export function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendUnauthorized(res);
      return;
    }
    if (roles.length && !roles.includes(req.user.role)) {
      sendForbidden(res, 'Insufficient permissions');
      return;
    }
    next();
  };
}
