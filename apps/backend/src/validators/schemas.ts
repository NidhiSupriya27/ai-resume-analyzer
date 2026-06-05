import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const createJobDescriptionSchema = z.object({
  title: z.string().min(2, 'Title is required').max(200),
  company: z.string().max(200).optional(),
  description: z.string().min(50, 'Job description must be at least 50 characters'),
  skills: z.array(z.string()).optional().default([]),
});

export const runAnalysisSchema = z.object({
  resumeIds: z.array(z.string().uuid()).min(1, 'At least one resume ID required'),
  jobDescriptionId: z.string().uuid('Invalid job description ID'),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateJobDescriptionInput = z.infer<typeof createJobDescriptionSchema>;
export type RunAnalysisInput = z.infer<typeof runAnalysisSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
