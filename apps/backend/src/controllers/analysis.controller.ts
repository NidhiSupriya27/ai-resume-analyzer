import { Request, Response, NextFunction } from 'express';
import { analysisService } from '../services/analysis.service';
import { sendCreated, sendSuccess } from '../utils/apiResponse';

export const analysisController = {
  async createJobDescription(req: Request, res: Response, next: NextFunction) {
    try {
      const { title, company, description, skills } = req.body;
      const jd = await analysisService.createJobDescription(
        req.user!.userId,
        title,
        company,
        description,
        skills || []
      );
      sendCreated(res, jd, 'Job description created');
    } catch (err) {
      next(err);
    }
  },

  async getJobDescriptions(req: Request, res: Response, next: NextFunction) {
    try {
      const jds = await analysisService.getJobDescriptions(req.user!.userId);
      sendSuccess(res, jds);
    } catch (err) {
      next(err);
    }
  },

  async runAnalysis(req: Request, res: Response, next: NextFunction) {
    try {
      const { resumeIds, jobDescriptionId } = req.body;
      const result = await analysisService.runAnalysis(
        req.user!.userId,
        resumeIds,
        jobDescriptionId
      );
      sendCreated(res, result, 'Analysis completed');
    } catch (err) {
      next(err);
    }
  },

  async getAnalysis(req: Request, res: Response, next: NextFunction) {
    try {
      const analysis = await analysisService.getAnalysis(req.params.id, req.user!.userId);
      sendSuccess(res, analysis);
    } catch (err) {
      next(err);
    }
  },

  async getRankings(req: Request, res: Response, next: NextFunction) {
    try {
      const { jobDescriptionId } = req.query;
      if (!jobDescriptionId) {
        res.status(400).json({ success: false, message: 'jobDescriptionId is required' });
        return;
      }
      const rankings = await analysisService.getRankings(
        req.user!.userId,
        jobDescriptionId as string
      );
      sendSuccess(res, rankings, 'Rankings retrieved');
    } catch (err) {
      next(err);
    }
  },

  async getAnalysesByJD(req: Request, res: Response, next: NextFunction) {
    try {
      const { jobDescriptionId } = req.query;
      if (!jobDescriptionId) {
        res.status(400).json({ success: false, message: 'jobDescriptionId is required' });
        return;
      }
      const analyses = await analysisService.getAnalysesByJD(
        req.user!.userId,
        jobDescriptionId as string
      );
      sendSuccess(res, analyses);
    } catch (err) {
      next(err);
    }
  },
};
