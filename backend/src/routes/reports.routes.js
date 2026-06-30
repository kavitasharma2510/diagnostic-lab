import path from 'path';
import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateBody } from '../middleware/validateBody.js';
import { reportController } from '../controllers/report.controller.js';
import { saveResultsSchema, approveReportSchema } from '../validators/report.validator.js';

const router = Router();

router.get('/', asyncHandler(reportController.list));
router.get('/eligible-bills', asyncHandler(reportController.eligibleBills));
router.post('/generate/:billId', asyncHandler(reportController.generate));
router.get('/:id/whatsapp-link', asyncHandler(reportController.whatsappLink));
router.get('/:id/download', asyncHandler(reportController.download));
router.get('/:id/preview', asyncHandler(reportController.preview));
router.get('/:id', asyncHandler(reportController.get));
router.put('/:id/results', validateBody(saveResultsSchema), asyncHandler(reportController.saveResults));
router.post('/:id/approve', validateBody(approveReportSchema), asyncHandler(reportController.approve));
router.delete('/:id', asyncHandler(reportController.remove));

export default router;
