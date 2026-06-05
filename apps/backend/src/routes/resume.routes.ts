import { Router } from 'express';
import { resumeController } from '../controllers/resume.controller';
import { authenticate } from '../middleware/auth';
import { uploadSingle, uploadMultiple } from '../middleware/upload';

const router = Router();

router.use(authenticate);

router.post('/upload', uploadSingle, resumeController.upload);
router.post('/upload-multiple', uploadMultiple, resumeController.uploadMultiple);
router.get('/', resumeController.getAll);
router.get('/:id', resumeController.getById);
router.delete('/:id', resumeController.delete);

export default router;
