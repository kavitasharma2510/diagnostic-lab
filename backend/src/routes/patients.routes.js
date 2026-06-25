import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateBody } from '../middleware/validateBody.js';
import { patientController } from '../controllers/patient.controller.js';
import { createPatientSchema, updatePatientSchema } from '../validators/patient.validator.js';

const router = Router();

router.get('/', asyncHandler(patientController.list));
router.post('/', validateBody(createPatientSchema), asyncHandler(patientController.create));
router.get('/:id', asyncHandler(patientController.get));
router.put('/:id', validateBody(updatePatientSchema), asyncHandler(patientController.update));
router.delete('/:id', asyncHandler(patientController.remove));

export default router;
