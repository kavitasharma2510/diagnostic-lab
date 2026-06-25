import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateBody } from '../middleware/validateBody.js';
import { sampleCollectionController } from '../controllers/sampleCollection.controller.js';
import {
    collectSampleSchema,
    rejectSampleSchema,
    updateSampleStatusSchema,
} from '../validators/sample.validator.js';

const router = Router();

router.get('/pending', asyncHandler(sampleCollectionController.listPending));
router.post('/collect', validateBody(collectSampleSchema), asyncHandler(sampleCollectionController.collect));
router.get('/collected', asyncHandler(sampleCollectionController.list));
router.get('/', asyncHandler(sampleCollectionController.list));
router.get('/:id/barcode-label', asyncHandler(sampleCollectionController.barcodeLabel));
router.get('/:id', asyncHandler(sampleCollectionController.get));
router.post('/:id/reject', validateBody(rejectSampleSchema), asyncHandler(sampleCollectionController.reject));
router.patch('/:id/status', validateBody(updateSampleStatusSchema), asyncHandler(sampleCollectionController.updateStatus));

export default router;
