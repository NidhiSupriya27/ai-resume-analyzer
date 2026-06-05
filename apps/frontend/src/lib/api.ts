import axios, { AxiosError } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor — handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: { page: number; limit: number; total: number; totalPages: number };
}

// Auth
export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    apiClient.post<ApiResponse<{ user: User; tokens: { accessToken: string } }>>('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    apiClient.post<ApiResponse<{ user: User; tokens: { accessToken: string } }>>('/auth/login', data),
  me: () => apiClient.get<ApiResponse<User>>('/auth/me'),
};

// Resumes
export const resumeApi = {
  upload: (file: File) => {
    const fd = new FormData();
    fd.append('resume', file);
    return apiClient.post<ApiResponse<Resume>>('/resume/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadMultiple: (files: File[]) => {
    const fd = new FormData();
    files.forEach((f) => fd.append('resumes', f));
    return apiClient.post<ApiResponse<Resume[]>>('/resume/upload-multiple', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getAll: (page = 1, limit = 10) =>
    apiClient.get<ApiResponse<Resume[]>>(`/resume?page=${page}&limit=${limit}`),
  getById: (id: string) => apiClient.get<ApiResponse<Resume>>(`/resume/${id}`),
  delete: (id: string) => apiClient.delete(`/resume/${id}`),
};

// Analysis
export const analysisApi = {
  createJD: (data: { title: string; company?: string; description: string; skills?: string[] }) =>
    apiClient.post<ApiResponse<JobDescription>>('/analysis/job-descriptions', data),
  getJDs: () => apiClient.get<ApiResponse<JobDescription[]>>('/analysis/job-descriptions'),
  runAnalysis: (data: { resumeIds: string[]; jobDescriptionId: string }) =>
    apiClient.post<ApiResponse<AnalysisResult[]>>('/analysis/run', data),
  getAnalysis: (id: string) => apiClient.get<ApiResponse<Analysis>>(`/analysis/${id}`),
  getRankings: (jobDescriptionId: string) =>
    apiClient.get<ApiResponse<Analysis[]>>(`/analysis/rankings?jobDescriptionId=${jobDescriptionId}`),
  getByJD: (jobDescriptionId: string) =>
    apiClient.get<ApiResponse<Analysis[]>>(`/analysis/by-jd?jobDescriptionId=${jobDescriptionId}`),
};

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Resume {
  id: string;
  userId: string;
  originalName: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  status: 'PENDING' | 'PROCESSING' | 'PROCESSED' | 'FAILED';
  rawText?: string;
  createdAt: string;
  sections?: ResumeSection[];
  _count?: { analyses: number };
}

export interface ResumeSection {
  id: string;
  type: string;
  content: string;
  metadata?: unknown;
}

export interface JobDescription {
  id: string;
  title: string;
  company?: string;
  description: string;
  skills: string[];
  createdAt: string;
}

export interface Analysis {
  id: string;
  resumeId: string;
  jobDescriptionId: string;
  overallScore: number;
  skillsScore: number;
  experienceScore: number;
  educationScore: number;
  semanticScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  interviewNotes: string[];
  detailedReport?: {
    skillsAnalysis: string;
    experienceAnalysis: string;
    educationAnalysis: string;
    overallAssessment: string;
  };
  rank?: number;
  status: string;
  createdAt: string;
  resume?: Resume;
  jobDescription?: JobDescription;
}

export interface AnalysisResult {
  successful: Analysis[];
  failed: { resumeId: string; error: string }[];
}
