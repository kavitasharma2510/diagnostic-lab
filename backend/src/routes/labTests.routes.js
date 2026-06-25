import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateBody } from '../middleware/validateBody.js';
import { labTestController } from '../controllers/labTest.controller.js';
import {
    createLabTestSchema,
    updateLabTestSchema,
    parameterSchema,
    updateParameterSchema,
} from '../validators/labTest.validator.js';

const router = Router();

router.get('/', asyncHandler(labTestController.list));
router.post('/', validateBody(createLabTestSchema), asyncHandler(labTestController.create));
router.get('/:id', asyncHandler(labTestController.get));
router.put('/:id', validateBody(updateLabTestSchema), asyncHandler(labTestController.update));
router.delete('/:id', asyncHandler(labTestController.remove));

router.get('/:labTestId/parameters', asyncHandler(labTestController.listParameters));
router.post('/:labTestId/parameters', validateBody(parameterSchema), asyncHandler(labTestController.createParameter));

export default router;
