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
