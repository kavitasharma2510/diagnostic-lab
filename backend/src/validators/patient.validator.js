import { z } from 'zod';

export const genderEnum = z.enum(['Male', 'Female', 'Other']);

function emptyToNull(value) {
    return value === '' ? null : value;
}

const optionalText = z.preprocess(
    emptyToNull,
    z.string().optional().nullable(),
);

const optionalMobile = z.preprocess(
    emptyToNull,
    z.string().min(10, 'Mobile must be at least 10 digits').max(15).optional().nullable(),
);

const optionalAge = z.preprocess(
    (value) => (value === '' || value === null || value === undefined ? null : value),
    z.coerce.number().int().min(0).max(150).optional().nullable(),
);

export const createPatientSchema = z.object({
    name: z.string().min(1).max(255),
    age: optionalAge,
    gender: genderEnum.optional().nullable(),
    mobile: optionalMobile,
    address: optionalText,
    referring_doctor: optionalText,
});

export const updatePatientSchema = createPatientSchema.partial();
