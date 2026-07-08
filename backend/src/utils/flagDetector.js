const GENDERED_REF_PATTERN = /M\s*[\/:]\s*([\d.]+)\s*[-–—]\s*([\d.]+).*F\s*[\/:]\s*([\d.]+)\s*[-–—]\s*([\d.]+)/i;

function normalizeGender(gender) {
    const value = String(gender || '').trim().toLowerCase();
    if (value === 'female' || value === 'f') return 'female';
    if (value === 'male' || value === 'm') return 'male';
    return null;
}

export function parseReferenceBounds(referenceRange, gender = null) {
    if (!referenceRange) return { min: null, max: null };
    const text = String(referenceRange);

    const gendered = text.match(GENDERED_REF_PATTERN);
    if (gendered) {
        const maleMin = Number(gendered[1]);
        const maleMax = Number(gendered[2]);
        const femaleMin = Number(gendered[3]);
        const femaleMax = Number(gendered[4]);
        const normalizedGender = normalizeGender(gender);

        if (normalizedGender === 'female') {
            return { min: femaleMin, max: femaleMax };
        }
        if (normalizedGender === 'male') {
            return { min: maleMin, max: maleMax };
        }
        return {
            min: Math.min(maleMin, femaleMin),
            max: Math.max(maleMax, femaleMax),
        };
    }

    const rangeMatch = text.match(/([\d.]+)\s*[-–—]\s*([\d.]+)/);
    if (rangeMatch) {
        return { min: Number(rangeMatch[1]), max: Number(rangeMatch[2]) };
    }
    const ltMatch = text.match(/<\s*([\d.]+)/);
    if (ltMatch) return { min: null, max: Number(ltMatch[1]) };
    const gtMatch = text.match(/>\s*([\d.]+)/);
    if (gtMatch) return { min: Number(gtMatch[1]), max: null };
    return { min: null, max: null };
}

export function detectFlag(resultValue, minValue, maxValue) {
    if (resultValue === null || resultValue === undefined || resultValue === '') {
        return null;
    }

    const numeric = Number(String(resultValue).replace(/[^0-9.-]/g, ''));
    if (Number.isNaN(numeric)) {
        const lower = String(resultValue).toLowerCase();
        if (['positive', 'reactive', 'detected'].some((k) => lower.includes(k))) return 'High';
        if (['negative', 'non-reactive', 'not detected'].some((k) => lower.includes(k))) return 'Normal';
        return null;
    }

    const min = minValue !== null && minValue !== undefined ? Number(minValue) : null;
    const max = maxValue !== null && maxValue !== undefined ? Number(maxValue) : null;

    if (min !== null && !Number.isNaN(min) && numeric < min) return 'Low';
    if (max !== null && !Number.isNaN(max) && numeric > max) return 'High';
    return 'Normal';
}

export function resolveResultFlag(resultValue, {
    referenceRange,
    minValue,
    maxValue,
    gender,
} = {}) {
    let min = null;
    let max = null;

    if (referenceRange && GENDERED_REF_PATTERN.test(referenceRange)) {
        ({ min, max } = parseReferenceBounds(referenceRange, gender));
    } else if (minValue != null || maxValue != null) {
        min = minValue != null ? Number(minValue) : null;
        max = maxValue != null ? Number(maxValue) : null;
    } else {
        ({ min, max } = parseReferenceBounds(referenceRange, gender));
    }

    return detectFlag(resultValue, min, max);
}
