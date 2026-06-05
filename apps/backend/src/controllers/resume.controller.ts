import { Request, Response, NextFunction } from 'express';
import { resumeService } from '../services/resume.service';
import { sendCreated, sendSuccess, sendPaginated, sendBadRequest } from '../utils/apiResponse';

export const resumeController = {
  async upload(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        sendBadRequest(res, 'No file uploaded');
        return;
      }
      const resume = await resumeService.uploadResume(req.user!.userId, req.file);
      sendCreated(res, resume, 'Resume uploaded. Processing started.');
    } catch (err) {
      next(err);
    }
  },

  async uploadMultiple(req: Request, res: Response, next: NextFunction) {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        sendBadRequest(res, 'No files uploaded');
        return;
      }
      const resumes = await resumeService.uploadMultipleResumes(req.user!.userId, files);
      sendCreated(res, resumes, `${resumes.length} resume(s) uploaded. Processing started.`);
    } catch (err) {
      next(err);
    }
  },

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const { resumes, total } = await resumeService.getResumes(req.user!.userId, page, limit);
      sendPaginated(res, resumes, total, page, limit);
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const resume = await resumeService.getResume(req.params.id, req.user!.userId);
      sendSuccess(res, resume);
    } catch (err) {
      next(err);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await resumeService.deleteResume(req.params.id, req.user!.userId);
      sendSuccess(res, null, 'Resume deleted');
    } catch (err) {
      next(err);
    }
  },
};
