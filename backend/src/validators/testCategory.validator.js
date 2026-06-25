import { z } from 'zod';

export const statusEnum = z.enum(['active', 'inactive']);

export const createTestCategorySchema = z.object({
    name: z.string().min(1).max(255),
    code: z.string().min(1).max(50),
    description: z.string().optional().nullable(),
    status: statusEnum.optional(),
});

export const updateTestCategorySchema = createTestCategorySchema.partial();
