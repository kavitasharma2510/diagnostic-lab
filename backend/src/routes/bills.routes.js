import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateBody } from '../middleware/validateBody.js';
import { billController } from '../controllers/bill.controller.js';
import { createBillSchema, updateBillSchema } from '../validators/bill.validator.js';

const router = Router();

router.get('/', asyncHandler(billController.list));
router.post('/', validateBody(createBillSchema), asyncHandler(billController.create));
router.get('/:id', asyncHandler(billController.get));
router.put('/:id', validateBody(updateBillSchema), asyncHandler(billController.update));
router.delete('/:id', asyncHandler(billController.remove));

export default router;
