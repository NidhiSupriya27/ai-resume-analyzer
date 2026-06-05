import { prisma } from '../config/database';
import { Resume, ResumeStatus, SectionType } from '@prisma/client';

export const resumeRepository = {
  async create(data: {
    userId: string;
    fileName: string;
    originalName: string;
    fileSize: number;
    mimeType: string;
    filePath: string;
  }): Promise<Resume> {
    return prisma.resume.create({ data });
  },

  async findById(id: string): Promise<Resume | null> {
    return prisma.resume.findUnique({
      where: { id },
      include: {
        sections: true,
        analyses: {
          include: { jobDescription: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  },

  async findByUserId(
    userId: string,
    page: number,
    limit: number
  ): Promise<{ resumes: Resume[]; total: number }> {
    const [resumes, total] = await Promise.all([
      prisma.resume.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          sections: true,
          _count: { select: { analyses: true } },
        },
      }),
      prisma.resume.count({ where: { userId } }),
    ]);
    return { resumes, total };
  },

  async updateStatus(id: string, status: ResumeStatus, rawText?: string): Promise<Resume> {
    return prisma.resume.update({
      where: { id },
      data: { status, ...(rawText && { rawText }) },
    });
  },

  async createSections(
    resumeId: string,
    sections: Array<{ type: SectionType; content: string; metadata?: object }>
  ) {
    return prisma.resumeSection.createMany({
      data: sections.map((s) => ({ ...s, resumeId })),
    });
  },

  async saveEmbedding(resumeId: string, section: string, embedding: number[]) {
    const vectorStr = `[${embedding.join(',')}]`;
    return prisma.$executeRaw`
      INSERT INTO resume_embeddings (id, "resumeId", section, embedding, "createdAt")
      VALUES (gen_random_uuid(), ${resumeId}, ${section}, ${vectorStr}::vector, NOW())
      ON CONFLICT DO NOTHING
    `;
  },

  async getEmbedding(resumeId: string): Promise<number[] | null> {
    const result = await prisma.$queryRaw<Array<{ embedding: string }>>`
      SELECT embedding::text FROM resume_embeddings WHERE "resumeId" = ${resumeId} AND section = 'full' LIMIT 1
    `;
    if (!result.length || !result[0].embedding) return null;
    const clean = result[0].embedding.replace(/[\[\]]/g, '');
    return clean.split(',').map(Number);
  },

  async deleteById(id: string): Promise<void> {
    await prisma.resume.delete({ where: { id } });
  },
};
