import { z } from 'zod';
import { objectIdSchema, optionalObjectIdSchema } from './common.js';

export const saveResultsSchema = z.object({
    remarks: z.string().optional().nullable(),
    prepared_by_id: optionalObjectIdSchema,
    results: z.array(z.object({
        id: objectIdSchema,
        result_value: z.string().optional().nullable(),
        unit: z.string().optional().nullable(),
        reference_range: z.string().optional().nullable(),
        min_value: z.coerce.number().optional().nullable(),
        max_value: z.coerce.number().optional().nullable(),
    })).min(1),
});

export const approveReportSchema = z.object({
    approved_by_id: optionalObjectIdSchema,
});
