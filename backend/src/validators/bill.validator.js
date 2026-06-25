import { z } from 'zod';
import { objectIdSchema } from './common.js';

export const paymentStatusEnum = z.enum(['Paid', 'Unpaid']);

export const createBillSchema = z.object({
    patient_id: objectIdSchema,
    lab_test_ids: z.array(objectIdSchema).optional().default([]),
    profile_ids: z.array(objectIdSchema).optional().default([]),
    payment_status: paymentStatusEnum.optional().default('Unpaid'),
    referred_doctor: z.string().optional().nullable(),
    remarks: z.string().optional().nullable(),
}).refine(
    (data) => (data.lab_test_ids?.length || 0) + (data.profile_ids?.length || 0) > 0,
    { message: 'Select at least one lab test or profile.', path: ['lab_test_ids'] },
);

export const updateBillSchema = z.object({
    payment_status: paymentStatusEnum.optional(),
    referred_doctor: z.string().optional().nullable(),
    remarks: z.string().optional().nullable(),
});
