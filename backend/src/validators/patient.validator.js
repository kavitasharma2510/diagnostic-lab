import { z } from 'zod';

export const genderEnum = z.enum(['Male', 'Female', 'Other']);

export const createPatientSchema = z.object({
    name: z.string().min(1).max(255),
    age: z.coerce.number().int().min(0).max(150).optional().nullable(),
    gender: genderEnum.optional().nullable(),
    mobile: z.string().min(10).max(15).optional().nullable(),
    address: z.string().optional().nullable(),
    referring_doctor: z.string().optional().nullable(),
});

export const updatePatientSchema = createPatientSchema.partial();
