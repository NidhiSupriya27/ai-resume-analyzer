import { resumeRepository } from '../repositories/resume.repository';
import { extractTextFromFile } from './textExtraction.service';
import { parseResumeWithAI, generateEmbedding } from '../config/gemini';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { logger } from '../utils/logger';
import { SectionType } from '@prisma/client';
import fs from 'fs';

export const resumeService = {
  async uploadResume(
    userId: string,
    file: Express.Multer.File
  ) {
    const resume = await resumeRepository.create({
      userId,
      fileName: file.filename,
      originalName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      filePath: file.path,
    });

    // Process async (don't await)
    processResumeAsync(resume.id, file.path, file.mimetype).catch((err) =>
      logger.error('Async resume processing failed', { resumeId: resume.id, error: err })
    );

    return resume;
  },

  async uploadMultipleResumes(userId: string, files: Express.Multer.File[]) {
    const resumes = await Promise.all(
      files.map((file) => resumeService.uploadResume(userId, file))
    );
    return resumes;
  },

  async getResumes(userId: string, page: number, limit: number) {
    return resumeRepository.findByUserId(userId, page, limit);
  },

  async getResume(id: string, userId: string) {
    const resume = await resumeRepository.findById(id);
    if (!resume) throw new NotFoundError('Resume not found');
    if (resume.userId !== userId) throw new ForbiddenError();
    return resume;
  },

  async deleteResume(id: string, userId: string) {
    const resume = await resumeRepository.findById(id);
    if (!resume) throw new NotFoundError('Resume not found');
    if (resume.userId !== userId) throw new ForbiddenError();

    // Delete file from disk
    try {
      if (fs.existsSync(resume.filePath)) {
        fs.unlinkSync(resume.filePath);
      }
    } catch (err) {
      logger.warn('Failed to delete resume file', { error: err });
    }

    await resumeRepository.deleteById(id);
  },
};

async function processResumeAsync(
  resumeId: string,
  filePath: string,
  mimeType: string
) {
  try {
    await resumeRepository.updateStatus(resumeId, 'PROCESSING');

    // Extract text
    const rawText = await extractTextFromFile(filePath, mimeType);
    await resumeRepository.updateStatus(resumeId, 'PROCESSING', rawText);

    // Parse with AI
    const parsed = await parseResumeWithAI(rawText);

    // Create sections
    const sections = [
      { type: SectionType.CONTACT, content: `${parsed.name}\n${parsed.email}\n${parsed.phone}\n${parsed.location}`, metadata: { name: parsed.name, email: parsed.email, phone: parsed.phone } },
      { type: SectionType.SUMMARY, content: parsed.summary },
      { type: SectionType.SKILLS, content: parsed.skills.join(', '), metadata: { skills: parsed.skills } },
      { type: SectionType.EXPERIENCE, content: JSON.stringify(parsed.experience), metadata: parsed.experience },
      { type: SectionType.EDUCATION, content: JSON.stringify(parsed.education), metadata: parsed.education },
      { type: SectionType.PROJECTS, content: JSON.stringify(parsed.projects), metadata: parsed.projects },
    ].filter((s) => s.content && s.content.trim() !== '');

    await resumeRepository.createSections(resumeId, sections);

    // Generate embeddings
    const fullEmbedding = await generateEmbedding(rawText.slice(0, 8000));
    await resumeRepository.saveEmbedding(resumeId, 'full', fullEmbedding);

    await resumeRepository.updateStatus(resumeId, 'PROCESSED');
    logger.info('Resume processed successfully', { resumeId });
  } catch (error) {
    logger.error('Resume processing failed', { resumeId, error });
    await resumeRepository.updateStatus(resumeId, 'FAILED');
  }
}
