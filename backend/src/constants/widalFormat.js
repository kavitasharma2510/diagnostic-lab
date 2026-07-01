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

export function isWidalResultComplete(resultValue) {
    const map = parseWidalResult(resultValue);
    return WIDAL_DILUTIONS.some((d) => {
        const v = normalizeReaction(map[d]);
        return v === '(+)' || v === '(-)';
    });
}

/** True when no (+) or (-) has been entered in any dilution cell. */
export function isWidalResultEmpty(resultValue) {
    return !isWidalResultComplete(resultValue);
}

export function buildWidalAntigenRows(reportRows) {
    return (reportRows || []).map((r) => ({
        testName: r.testName,
        dilutions: parseWidalResult(r.resultValue),
    }));
}

export function computeWidalOverall(antigenRows) {
    const typhiO = antigenRows.find((r) => /typhi\s*"o"/i.test(r.testName));
    if (!typhiO) return 'NEGATIVE';

    const idx160 = WIDAL_DILUTIONS.indexOf('1:160');
    for (let i = WIDAL_DILUTIONS.length - 1; i >= idx160; i -= 1) {
        const d = WIDAL_DILUTIONS[i];
        if (normalizeReaction(typhiO.dilutions[d]) === '(+)') return 'POSITIVE';
    }

    return 'NEGATIVE';
}

export function buildWidalNote(antigenRows) {
    const typhiO = antigenRows.find((r) => /typhi\s*"o"/i.test(r.testName));
    if (!typhiO) return '';

    let highest = null;
    for (const d of WIDAL_DILUTIONS) {
        if (normalizeReaction(typhiO.dilutions[d]) === '(+)') highest = d;
    }

    if (!highest) return '';
    return `S. TYPHI O UPTO ${highest} DILUTION`;
}
