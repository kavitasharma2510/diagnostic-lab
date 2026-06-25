import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateBody } from '../middleware/validateBody.js';
import { testCategoryController } from '../controllers/testCategory.controller.js';
import { createTestCategorySchema, updateTestCategorySchema } from '../validators/testCategory.validator.js';

const router = Router();

router.get('/', asyncHandler(testCategoryController.list));
router.post('/', validateBody(createTestCategorySchema), asyncHandler(testCategoryController.create));
router.get('/:id', asyncHandler(testCategoryController.get));
router.put('/:id', validateBody(updateTestCategorySchema), asyncHandler(testCategoryController.update));
router.delete('/:id', asyncHandler(testCategoryController.remove));

export default router;
