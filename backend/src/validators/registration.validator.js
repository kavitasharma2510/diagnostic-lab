import { z } from 'zod';
import { objectIdSchema } from './common.js';
import { createPatientSchema } from './patient.validator.js';

export const registerPatientSchema = z.object({
    patient_id: objectIdSchema.optional().nullable(),
    patient: createPatientSchema.partial().optional(),
    lab_test_ids: z.array(objectIdSchema).min(1, 'Select at least one test.'),
    profile_ids: z.array(objectIdSchema).optional().default([]),
    referred_doctor: z.string().optional().nullable(),
}).superRefine((data, ctx) => {
    if (!data.patient_id && !data.patient?.name?.trim()) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Select an existing patient or enter a new patient name.',
            path: ['patient_id'],
        });
    }
});
