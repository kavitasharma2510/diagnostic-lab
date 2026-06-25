import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateBody } from '../middleware/validateBody.js';
import { profileController } from '../controllers/profile.controller.js';
import {
    createProfileSchema,
    updateProfileSchema,
    syncProfileTestsSchema,
} from '../validators/profile.validator.js';

const router = Router();

router.get('/', asyncHandler(profileController.list));
router.post('/', validateBody(createProfileSchema), asyncHandler(profileController.create));
router.get('/:id', asyncHandler(profileController.get));
router.put('/:id', validateBody(updateProfileSchema), asyncHandler(profileController.update));
router.delete('/:id', asyncHandler(profileController.remove));
router.post('/:id/sync-tests', validateBody(syncProfileTestsSchema), asyncHandler(profileController.syncTests));

export default router;
