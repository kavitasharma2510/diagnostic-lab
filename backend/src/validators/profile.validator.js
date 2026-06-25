import { z } from 'zod';
import { objectIdSchema } from './common.js';
import { statusEnum } from './testCategory.validator.js';

export const createProfileSchema = z.object({
    name: z.string().min(1).max(255),
    code: z.string().min(1).max(50),
    price: z.coerce.number().min(0),
    description: z.string().optional().nullable(),
    status: statusEnum.optional(),
    test_ids: z.array(objectIdSchema).optional(),
});

export const updateProfileSchema = createProfileSchema.partial();

export const syncProfileTestsSchema = z.object({
    tests: z.array(z.object({
        test_id: objectIdSchema,
        sort_order: z.coerce.number().optional(),
    })).min(1),
});
