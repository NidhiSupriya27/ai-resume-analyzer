// Shared types used across frontend and backend

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: PaginatedResponse<unknown>['meta'];
  errors?: unknown;
  timestamp: string;
}

export type ResumeStatus = 'PENDING' | 'PROCESSING' | 'PROCESSED' | 'FAILED';
export type AnalysisStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type SectionType = 'CONTACT' | 'SUMMARY' | 'SKILLS' | 'EXPERIENCE' | 'EDUCATION' | 'PROJECTS' | 'CERTIFICATIONS' | 'OTHER';
export type UserRole = 'RECRUITER' | 'ADMIN';

export interface ScoreBreakdown {
  overallScore: number;
  skillsScore: number;
  experienceScore: number;
  educationScore: number;
  semanticScore: number;
}

export interface AnalysisFeedback {
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  interviewNotes: string[];
}
