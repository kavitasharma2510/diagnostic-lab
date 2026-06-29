import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateBody } from '../middleware/validateBody.js';
import { registrationController } from '../controllers/registration.controller.js';
import { registerPatientSchema } from '../validators/registration.validator.js';

const router = Router();

router.post('/', validateBody(registerPatientSchema), asyncHandler(registrationController.register));

export default router;
