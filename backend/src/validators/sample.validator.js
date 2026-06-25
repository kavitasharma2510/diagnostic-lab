import { z } from 'zod';
import { objectIdSchema, optionalObjectIdSchema } from './common.js';

export const collectSampleSchema = z.object({
    bill_id: objectIdSchema,
    sample_type: z.string().min(1),
    bill_test_ids: z.array(objectIdSchema).min(1),
    collected_by_id: optionalObjectIdSchema,
    remarks: z.string().optional().nullable(),
});

export const rejectSampleSchema = z.object({
    rejection_reason: z.string().min(1),
    rejected_by_id: optionalObjectIdSchema,
});

export const updateSampleStatusSchema = z.object({
    status: z.enum(['pending', 'collected', 'processing', 'completed', 'rejected']),
    changed_by_id: optionalObjectIdSchema,
    remarks: z.string().optional().nullable(),
});
