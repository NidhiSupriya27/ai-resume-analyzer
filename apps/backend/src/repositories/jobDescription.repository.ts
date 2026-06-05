import { prisma } from '../config/database';
import { JobDescription } from '@prisma/client';

export const jobDescriptionRepository = {
  async create(data: {
    userId: string;
    title: string;
    company?: string;
    description: string;
    skills: string[];
  }): Promise<JobDescription> {
    return prisma.jobDescription.create({ data });
  },

  async findById(id: string): Promise<JobDescription | null> {
    return prisma.jobDescription.findUnique({ where: { id } });
  },

  async findByUserId(userId: string): Promise<JobDescription[]> {
    return prisma.jobDescription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  },

  async saveEmbedding(jobDescriptionId: string, embedding: number[]) {
    const vectorStr = `[${embedding.join(',')}]`;
    return prisma.$executeRaw`
      INSERT INTO job_description_embeddings (id, "jobDescriptionId", embedding, "createdAt")
      VALUES (gen_random_uuid(), ${jobDescriptionId}, ${vectorStr}::vector, NOW())
      ON CONFLICT DO NOTHING
    `;
  },

  async getEmbedding(jobDescriptionId: string): Promise<number[] | null> {
    const result = await prisma.$queryRaw<Array<{ embedding: string }>>`
      SELECT embedding::text FROM job_description_embeddings WHERE "jobDescriptionId" = ${jobDescriptionId} LIMIT 1
    `;
    if (!result.length || !result[0].embedding) return null;
    const clean = result[0].embedding.replace(/[\[\]]/g, '');
    return clean.split(',').map(Number);
  },
};
