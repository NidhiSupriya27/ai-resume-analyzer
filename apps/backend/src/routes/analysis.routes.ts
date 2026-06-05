import { Router } from 'express';
import { analysisController } from '../controllers/analysis.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createJobDescriptionSchema, runAnalysisSchema } from '../validators/schemas';

const router = Router();

router.use(authenticate);

router.post('/job-descriptions', validate(createJobDescriptionSchema), analysisController.createJobDescription);
router.get('/job-descriptions', analysisController.getJobDescriptions);
router.post('/run', validate(runAnalysisSchema), analysisController.runAnalysis);
router.get('/rankings', analysisController.getRankings);
router.get('/by-jd', analysisController.getAnalysesByJD);
router.get('/:id', analysisController.getAnalysis);

export default router;
