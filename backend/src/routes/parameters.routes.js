import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateBody } from '../middleware/validateBody.js';
import { labTestController } from '../controllers/labTest.controller.js';
import { updateParameterSchema } from '../validators/labTest.validator.js';

const router = Router();

router.get('/:id', asyncHandler(labTestController.getParameter));
router.put('/:id', validateBody(updateParameterSchema), asyncHandler(labTestController.updateParameter));
router.delete('/:id', asyncHandler(labTestController.removeParameter));

export default router;
