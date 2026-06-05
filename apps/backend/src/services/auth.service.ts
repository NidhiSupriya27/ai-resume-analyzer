import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/user.repository';
import { AuthError, ConflictError } from '../utils/errors';
import { logger } from '../utils/logger';

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface AuthTokens {
  accessToken: string;
  expiresIn: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export const authService = {
  async register(name: string, email: string, password: string): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    const existing = await userRepository.findByEmail(email);
    if (existing) throw new ConflictError('Email already in use');

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await userRepository.create({ name, email, passwordHash });

    logger.info('User registered', { userId: user.id, email });

    const tokens = generateTokens(user.id, user.email, user.role);
    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      tokens,
    };
  },

  async login(email: string, password: string): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    const user = await userRepository.findByEmail(email);
    if (!user) throw new AuthError('Invalid credentials');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new AuthError('Invalid credentials');

    logger.info('User logged in', { userId: user.id, email });

    const tokens = generateTokens(user.id, user.email, user.role);
    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      tokens,
    };
  },

  async getProfile(userId: string): Promise<AuthUser> {
    const user = await userRepository.findById(userId);
    if (!user) throw new AuthError('User not found');
    return { id: user.id, email: user.email, name: user.name, role: user.role };
  },
};

function generateTokens(userId: string, email: string, role: string): AuthTokens {
  const accessToken = jwt.sign({ userId, email, role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);
  return { accessToken, expiresIn: JWT_EXPIRES_IN };
}
