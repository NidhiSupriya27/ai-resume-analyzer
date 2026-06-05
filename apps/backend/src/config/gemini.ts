import { GoogleGenAI } from '@google/genai';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

// Lazy singleton — created once, reused on every call
let ai: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new AppError('GEMINI_API_KEY is not configured', 500);
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

// Current stable models as of June 2026:
//   Text generation : gemini-2.5-flash   (gemini-1.5 and 2.0 are shut down → 404)
//   Embeddings      : gemini-embedding-001 (text-embedding-004 is shut down → 404)
const TEXT_MODEL      = 'gemini-2.5-flash';
const EMBEDDING_MODEL = 'gemini-embedding-001';

export interface ParsedResume {
  name: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  skills: string[];
  experience: Array<{
    company: string;
    title: string;
    startDate: string;
    endDate: string;
    description: string;
    technologies: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    gpa?: string;
  }>;
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
    url?: string;
  }>;
  certifications: string[];
  languages: string[];
  totalYearsExperience: number;
}

export interface AnalysisResult {
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
  detailedReport: {
    skillsAnalysis: string;
    experienceAnalysis: string;
    educationAnalysis: string;
    overallAssessment: string;
  };
}

export async function parseResumeWithAI(resumeText: string): Promise<ParsedResume> {
  const prompt = `You are an expert resume parser. Extract structured data from the following resume text.
Return ONLY a valid JSON object with no markdown, no code blocks, no explanation.

Resume text:
${resumeText}

Return this exact JSON structure:
{
  "name": "full name",
  "email": "email address",
  "phone": "phone number",
  "location": "city, state/country",
  "summary": "professional summary",
  "skills": ["skill1", "skill2"],
  "experience": [
    {
      "company": "company name",
      "title": "job title",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM or Present",
      "description": "job description",
      "technologies": ["tech1", "tech2"]
    }
  ],
  "education": [
    {
      "institution": "university name",
      "degree": "Bachelor/Master/PhD",
      "field": "field of study",
      "startDate": "YYYY",
      "endDate": "YYYY",
      "gpa": "3.8"
    }
  ],
  "projects": [
    {
      "name": "project name",
      "description": "description",
      "technologies": ["tech1"],
      "url": "optional url"
    }
  ],
  "certifications": ["cert1", "cert2"],
  "languages": ["English", "Spanish"],
  "totalYearsExperience": 5
}`;

  try {
    const response = await getAI().models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });
    const text = response.text?.trim() ?? '';
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned) as ParsedResume;
  } catch (error) {
    logger.error('Failed to parse resume with AI', { error });
    throw new AppError('Failed to parse resume with AI', 500);
  }
}

export async function analyzeResumeAgainstJD(
  resumeText: string,
  jobDescription: string,
  parsedResume: ParsedResume,
  semanticScore: number
): Promise<AnalysisResult> {
  const prompt = `You are a senior technical recruiter and career coach with expertise in ATS systems.
Analyze this candidate's resume against the job description and provide a comprehensive assessment.
Return ONLY valid JSON, no markdown, no code blocks, no explanation.

CANDIDATE RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

CANDIDATE SKILLS: ${parsedResume.skills.join(', ')}
SEMANTIC SIMILARITY SCORE: ${semanticScore} (0-100 scale, embedding-based)

Provide scores from 0-100 and return this exact JSON:
{
  "overallScore": 85,
  "skillsScore": 90,
  "experienceScore": 82,
  "educationScore": 88,
  "matchedSkills": ["skill1", "skill2"],
  "missingSkills": ["skill3", "skill4"],
  "strengths": [
    "Specific strength 1 with detail",
    "Specific strength 2 with detail"
  ],
  "weaknesses": [
    "Specific weakness 1",
    "Specific weakness 2"
  ],
  "suggestions": [
    "Actionable improvement suggestion 1",
    "Actionable improvement suggestion 2",
    "Actionable improvement suggestion 3"
  ],
  "interviewNotes": [
    "Interview topic 1 to probe",
    "Interview topic 2 to probe",
    "Areas to explore during interview"
  ],
  "detailedReport": {
    "skillsAnalysis": "Detailed analysis of technical skills match",
    "experienceAnalysis": "Detailed analysis of experience relevance",
    "educationAnalysis": "Detailed analysis of educational background",
    "overallAssessment": "Comprehensive assessment paragraph"
  }
}`;

  try {
    const response = await getAI().models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });
    const text = response.text?.trim() ?? '';
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned) as AnalysisResult;
    // Blend AI score with semantic similarity
    parsed.semanticScore = semanticScore;
    parsed.overallScore = Math.round(parsed.overallScore * 0.6 + semanticScore * 0.4);
    return parsed;
  } catch (error) {
    logger.error('Failed to analyze resume against JD', { error });
    throw new AppError('Failed to analyze resume', 500);
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await getAI().models.embedContent({
      model: EMBEDDING_MODEL,
      contents: text.slice(0, 8000), // truncate for safety
    });
    // New SDK returns response.embeddings[0].values
    const values = response.embeddings?.[0]?.values;
    if (!values) throw new Error('No embedding values returned');
    return values;
  } catch (error) {
    logger.error('Failed to generate embedding', { error });
    throw new AppError('Failed to generate embedding', 500);
  }
}

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
