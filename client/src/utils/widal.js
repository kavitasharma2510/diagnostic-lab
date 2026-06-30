export const WIDAL_DILUTIONS = ['1:20', '1:40', '1:80', '1:160', '1:320', '1:640'];

export function isWidalCode(code) {
    return String(code || '').toUpperCase() === 'WIDAL';
}

export function emptyWidalDilutions() {
    return Object.fromEntries(WIDAL_DILUTIONS.map((d) => [d, '']));
}

export function normalizeReaction(value) {
    const v = String(value || '').trim();
    if (v === '+' || v === '(+)') return '(+)';
    if (v === '-' || v === '(-)') return '(-)';
    return v;
}

export function parseWidalResult(resultValue) {
    const empty = emptyWidalDilutions();
    if (!resultValue) return empty;

    const trimmed = String(resultValue).trim();
    if (trimmed.startsWith('{')) {
        try {
            const parsed = JSON.parse(trimmed);
            return { ...empty, ...parsed };
        } catch {
            return empty;
        }
    }

    const parts = trimmed.split(';').map((s) => s.trim());
    if (parts.length === WIDAL_DILUTIONS.length) {
        return Object.fromEntries(WIDAL_DILUTIONS.map((d, i) => [d, normalizeReaction(parts[i])]));
    }

    if (trimmed === '(+)' || trimmed === '(-)') {
        return Object.fromEntries(WIDAL_DILUTIONS.map((d) => [d, trimmed]));
    }

    return empty;
}

export function serializeWidalResult(dilutionMap) {
    return JSON.stringify(
        Object.fromEntries(WIDAL_DILUTIONS.map((d) => [d, normalizeReaction(dilutionMap[d]) || ''])),
    );
}

export const WIDAL_REACTION_OPTIONS = [
    { label: '(+)', value: '(+)' },
    { label: '(-)', value: '(-)' },
];

export const WIDAL_DEFAULT_ANTIGENS = [
    'S. Typhi "O"',
    'S. Typhi "H"',
    'S. Para Typhi "A H"',
    'S. Para Typhi "B H"',
];

export function buildDefaultWidalParameters() {
    return WIDAL_DEFAULT_ANTIGENS.map((name, index) => ({
        name,
        unit: '',
        reference_range: '(+) / (-)',
        min_value: null,
        max_value: null,
        method: 'Slide Agglutination',
        sort_order: index,
        status: 'active',
    }));
}

export function buildWidalAntigenRows(rows) {
    return (rows || []).map((r) => ({
        testName: r.test_name || r.testName,
        dilutions: parseWidalResult(r.result_value || r.resultValue),
    }));
}

export function computeWidalOverall(rows) {
    const antigenRows = buildWidalAntigenRows(rows);
    const typhiO = antigenRows.find((r) => /typhi\s*"o"/i.test(r.testName));
    if (!typhiO) return 'NEGATIVE';

    const idx160 = WIDAL_DILUTIONS.indexOf('1:160');
    for (let i = WIDAL_DILUTIONS.length - 1; i >= idx160; i -= 1) {
        const d = WIDAL_DILUTIONS[i];
        if (normalizeReaction(typhiO.dilutions[d]) === '(+)') return 'POSITIVE';
    }
    return 'NEGATIVE';
}

export function buildWidalNote(rows) {
    const antigenRows = buildWidalAntigenRows(rows);
    const typhiO = antigenRows.find((r) => /typhi\s*"o"/i.test(r.testName));
    if (!typhiO) return '';

    let highest = null;
    for (const d of WIDAL_DILUTIONS) {
        if (normalizeReaction(typhiO.dilutions[d]) === '(+)') highest = d;
    }
    if (!highest) return '';
    return `S. TYPHI O UPTO ${highest} DILUTION`;
}

export function isWidalReportRow(row, allRows = []) {
    if (isWidalCode(row.lab_test_code)) return true;
    if (isWidalCode(row.lab_test?.code)) return true;
    if (isWidalCode(row.category_code)) return true;
    if (isWidalCode(row.lab_test?.category?.code)) return true;

    const widalLabTestId = allRows.find((r) => isWidalCode(r.lab_test_code || r.lab_test?.code))?.lab_test_id;
    if (widalLabTestId && row.lab_test_id === widalLabTestId) return true;

    const name = String(row.test_name || '').trim().toLowerCase();
    return WIDAL_DEFAULT_ANTIGENS.some((a) => a.toLowerCase() === name);
}
