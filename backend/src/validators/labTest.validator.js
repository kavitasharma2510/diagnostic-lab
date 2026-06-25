import { z } from 'zod';
import { objectIdSchema, optionalObjectIdSchema } from './common.js';
import { statusEnum } from './testCategory.validator.js';

export const parameterSchema = z.object({
    name: z.string().min(1),
    unit: z.string().optional().nullable(),
    reference_range: z.string().optional().nullable(),
    min_value: z.coerce.number().optional().nullable(),
    max_value: z.coerce.number().optional().nullable(),
    method: z.string().optional().nullable(),
    sort_order: z.coerce.number().optional(),
    status: statusEnum.optional(),
});

export const createLabTestSchema = z.object({
    test_category_id: objectIdSchema,
    name: z.string().min(1).max(255),
    code: z.string().min(1).max(50),
    sample_type: z.string().min(1).max(100),
    report_type: z.enum(['single', 'grouped']).optional(),
    unit: z.string().optional().nullable(),
    price: z.coerce.number().min(0),
    method: z.string().optional().nullable(),
    default_value: z.string().optional().nullable(),
    reference_range: z.string().optional().nullable(),
    min_value: z.coerce.number().optional().nullable(),
    max_value: z.coerce.number().optional().nullable(),
    sort_order: z.coerce.number().optional(),
    status: statusEnum.optional(),
    parameters: z.array(parameterSchema).optional(),
});

export const updateLabTestSchema = createLabTestSchema.partial();

export const updateParameterSchema = parameterSchema.partial();
