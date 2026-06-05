import { prisma } from '../config/database';
import { Analysis, AnalysisStatus } from '@prisma/client';

export const analysisRepository = {
  async create(data: {
    resumeId: string;
    jobDescriptionId: string;
    userId: string;
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
    detailedReport?: object;
    status: AnalysisStatus;
  }): Promise<Analysis> {
    return prisma.analysis.create({
      data,
      include: {
        resume: true,
        jobDescription: true,
      },
    });
  },

  async upsert(data: Parameters<typeof analysisRepository.create>[0]): Promise<Analysis> {
    return prisma.analysis.upsert({
      where: {
        resumeId_jobDescriptionId: {
          resumeId: data.resumeId,
          jobDescriptionId: data.jobDescriptionId,
        },
      },
      create: data,
      update: data,
      include: { resume: true, jobDescription: true },
    });
  },

  async findById(id: string): Promise<Analysis | null> {
    return prisma.analysis.findUnique({
      where: { id },
      include: {
        resume: { include: { sections: true } },
        jobDescription: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });
  },

  async findByJobDescription(
    jobDescriptionId: string,
    userId: string
  ): Promise<Analysis[]> {
    return prisma.analysis.findMany({
      where: { jobDescriptionId, userId },
      include: {
        resume: { select: { id: true, originalName: true, status: true } },
        jobDescription: { select: { id: true, title: true, company: true } },
      },
      orderBy: { overallScore: 'desc' },
    });
  },

  async getRankings(jobDescriptionId: string, userId: string): Promise<Analysis[]> {
    const analyses = await prisma.analysis.findMany({
      where: { jobDescriptionId, userId, status: 'COMPLETED' },
      include: {
        resume: { select: { id: true, originalName: true, createdAt: true } },
        jobDescription: { select: { id: true, title: true, company: true } },
      },
      orderBy: { overallScore: 'desc' },
    });

    // Update ranks
    await Promise.all(
      analyses.map((a, idx) =>
        prisma.analysis.update({ where: { id: a.id }, data: { rank: idx + 1 } })
      )
    );

    return analyses.map((a, idx) => ({ ...a, rank: idx + 1 }));
  },

  async updateStatus(id: string, status: AnalysisStatus): Promise<Analysis> {
    return prisma.analysis.update({ where: { id }, data: { status } });
  },
};
