import { analysisRepository } from '../repositories/analysis.repository';
import { resumeRepository } from '../repositories/resume.repository';
import { jobDescriptionRepository } from '../repositories/jobDescription.repository';
import {
  analyzeResumeAgainstJD,
  generateEmbedding,
  cosineSimilarity,
} from '../config/gemini';
import { NotFoundError, ForbiddenError, AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { cacheGet, cacheSet, cacheDelPattern } from '../config/redis';

export const analysisService = {
  async createJobDescription(
    userId: string,
    title: string,
    company: string | undefined,
    description: string,
    skills: string[]
  ) {
    const jd = await jobDescriptionRepository.create({ userId, title, company, description, skills });

    // Generate JD embedding async
    generateEmbedding(description.slice(0, 8000))
      .then((emb) => jobDescriptionRepository.saveEmbedding(jd.id, emb))
      .catch((err) => logger.warn('JD embedding failed', { error: err }));

    return jd;
  },

  async getJobDescriptions(userId: string) {
    return jobDescriptionRepository.findByUserId(userId);
  },

  async runAnalysis(userId: string, resumeIds: string[], jobDescriptionId: string) {
    const jd = await jobDescriptionRepository.findById(jobDescriptionId);
    if (!jd) throw new NotFoundError('Job description not found');
    if (jd.userId !== userId) throw new ForbiddenError();

    // Process in parallel
    const results = await Promise.allSettled(
      resumeIds.map((resumeId) =>
        analyzeResume(userId, resumeId, jd.id, jd.description)
      )
    );

    const successful = results
      .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof analyzeResume>>> => r.status === 'fulfilled')
      .map((r) => r.value);

    const failed = results
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .map((r, i) => ({ resumeId: resumeIds[i], error: r.reason?.message }));

    await cacheDelPattern(`rankings:${userId}:${jobDescriptionId}`);

    return { successful, failed };
  },

  async getAnalysis(id: string, userId: string) {
    const cacheKey = `analysis:${id}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const analysis = await analysisRepository.findById(id);
    if (!analysis) throw new NotFoundError('Analysis not found');
    if (analysis.userId !== userId) throw new ForbiddenError();

    await cacheSet(cacheKey, analysis, 600);
    return analysis;
  },

  async getRankings(userId: string, jobDescriptionId: string) {
    const cacheKey = `rankings:${userId}:${jobDescriptionId}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const rankings = await analysisRepository.getRankings(jobDescriptionId, userId);
    await cacheSet(cacheKey, rankings, 300);
    return rankings;
  },

  async getAnalysesByJD(userId: string, jobDescriptionId: string) {
    return analysisRepository.findByJobDescription(jobDescriptionId, userId);
  },
};

async function analyzeResume(
  userId: string,
  resumeId: string,
  jobDescriptionId: string,
  jdText: string
) {
  const resume = await resumeRepository.findById(resumeId);
  if (!resume) throw new NotFoundError(`Resume ${resumeId} not found`);
  if (resume.userId !== userId) throw new ForbiddenError();
  if (!resume.rawText) throw new AppError('Resume has not been processed yet', 400);

  // Get or generate embeddings
  let resumeEmbedding = await resumeRepository.getEmbedding(resumeId);
  if (!resumeEmbedding) {
    resumeEmbedding = await generateEmbedding(resume.rawText.slice(0, 8000));
    await resumeRepository.saveEmbedding(resumeId, 'full', resumeEmbedding);
  }

  let jdEmbedding = await jobDescriptionRepository.getEmbedding(jobDescriptionId);
  if (!jdEmbedding) {
    jdEmbedding = await generateEmbedding(jdText.slice(0, 8000));
    await jobDescriptionRepository.saveEmbedding(jobDescriptionId, jdEmbedding);
  }

  // Cosine similarity (0-1 → 0-100)
  const rawSimilarity = cosineSimilarity(resumeEmbedding, jdEmbedding);
  const semanticScore = Math.round(rawSimilarity * 100);

  // AI analysis
  const skillsSection = resume.sections?.find((s) => s.type === 'SKILLS');
  const parsedResumeData = {
    name: '',
    email: '',
    phone: '',
    location: '',
    summary: '',
    skills: skillsSection?.content.split(', ') || [],
    experience: [],
    education: [],
    projects: [],
    certifications: [],
    languages: [],
    totalYearsExperience: 0,
  };

  const aiResult = await analyzeResumeAgainstJD(
    resume.rawText,
    jdText,
    parsedResumeData,
    semanticScore
  );

  const analysis = await analysisRepository.upsert({
    resumeId,
    jobDescriptionId,
    userId,
    overallScore: aiResult.overallScore,
    skillsScore: aiResult.skillsScore,
    experienceScore: aiResult.experienceScore,
    educationScore: aiResult.educationScore,
    semanticScore: aiResult.semanticScore,
    matchedSkills: aiResult.matchedSkills,
    missingSkills: aiResult.missingSkills,
    strengths: aiResult.strengths,
    weaknesses: aiResult.weaknesses,
    suggestions: aiResult.suggestions,
    interviewNotes: aiResult.interviewNotes,
    detailedReport: aiResult.detailedReport,
    status: 'COMPLETED',
  });

  logger.info('Analysis completed', {
    analysisId: analysis.id,
    resumeId,
    score: aiResult.overallScore,
  });

  return analysis;
}
