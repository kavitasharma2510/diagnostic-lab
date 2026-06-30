/** @typedef {{ name: string; unit: string; reference_range: string; min_value?: number; max_value?: number; method?: string }} PanelParam */

/** @type {Record<string, PanelParam[]>} */
export const PANEL_PARAMETERS = {
    CBC: [
        { name: 'WBC', unit: '10³/µL', reference_range: '4.0 - 11.0', min_value: 4.0, max_value: 11.0 },
        { name: 'Lymph#', unit: '10³/µL', reference_range: '1.0 - 3.0', min_value: 1.0, max_value: 3.0 },
        { name: 'Mid#', unit: '10³/µL', reference_range: '0.2 - 1.0', min_value: 0.2, max_value: 1.0 },
        { name: 'Gran#', unit: '10³/µL', reference_range: '2.0 - 7.0', min_value: 2.0, max_value: 7.0 },
        { name: 'Lymph%', unit: '%', reference_range: '20 - 40', min_value: 20, max_value: 40 },
        { name: 'Mid%', unit: '%', reference_range: '3 - 15', min_value: 3, max_value: 15 },
        { name: 'Gran%', unit: '%', reference_range: '50 - 70', min_value: 50, max_value: 70 },
        { name: 'HEMOGLOBIN', unit: 'g/dL', reference_range: 'M/13-17 F/12-15', min_value: 12.0, max_value: 17.0 },
        { name: 'RBC', unit: '10⁶/µL', reference_range: '4.1 - 5.9', min_value: 4.1, max_value: 5.9 },
        { name: 'HCT', unit: '%', reference_range: '36 - 50', min_value: 36, max_value: 50 },
        { name: 'MCV', unit: 'fL', reference_range: '80 - 100', min_value: 80, max_value: 100 },
        { name: 'MCH', unit: 'pg', reference_range: '27 - 33', min_value: 27, max_value: 33 },
        { name: 'MCHC', unit: 'g/dL', reference_range: '32 - 36', min_value: 32, max_value: 36 },
        { name: 'RDW-CV', unit: '%', reference_range: '11.5 - 14.5', min_value: 11.5, max_value: 14.5 },
        { name: 'RDW-SD', unit: 'fL', reference_range: '39 - 46', min_value: 39, max_value: 46 },
        { name: 'PLATELET', unit: '10³/µL', reference_range: '150 - 450', min_value: 150, max_value: 450 },
        { name: 'MPV', unit: 'fL', reference_range: '7.5 - 11.5', min_value: 7.5, max_value: 11.5 },
        { name: 'PDW', unit: '', reference_range: '9 - 17', min_value: 9, max_value: 17 },
        { name: 'PCT', unit: '%', reference_range: '0.20 - 0.36', min_value: 0.20, max_value: 0.36 },
    ],
    LFT: [
        { name: 'BILIRUBIN TOTAL', unit: 'mg/dL', reference_range: '0.1 - 1.2', min_value: 0.1, max_value: 1.2, method: 'Photometry' },
        { name: 'BILIRUBIN DIRECT', unit: 'mg/dL', reference_range: '0.0 - 0.4', min_value: 0.0, max_value: 0.4, method: 'Photometry' },
        { name: 'BILIRUBIN INDIRECT', unit: 'mg/dL', reference_range: '0.1 - 1.0', min_value: 0.1, max_value: 1.0, method: 'Calculated' },
        { name: 'SGPT', unit: 'IU/L', reference_range: '7 - 55', min_value: 7, max_value: 55, method: 'IFCC' },
        { name: 'SGOT', unit: 'IU/L', reference_range: '8 - 48', min_value: 8, max_value: 48, method: 'IFCC' },
        { name: 'SGOT/SGPT RATIO', unit: 'RATIO', reference_range: '0 - 46', min_value: 0, max_value: 46, method: 'Calculated' },
        { name: 'ALKALINE PHOSPHATASE', unit: 'U/L', reference_range: '35 - 140', min_value: 35, max_value: 140, method: 'IFCC' },
        { name: 'GAMMA GLUTAMYL TRANSFERASE (GGT)', unit: 'U/L', reference_range: '0 - 55', min_value: 0, max_value: 55, method: 'IFCC' },
        { name: 'TOTAL PROTEINS', unit: 'gm/dL', reference_range: '6.2 - 8.0', min_value: 6.2, max_value: 8.0, method: 'Biuret' },
        { name: 'ALBUMIN', unit: 'gm/dL', reference_range: '3.5 - 5.5', min_value: 3.5, max_value: 5.5, method: 'BCG' },
        { name: 'GLOBULIN', unit: 'gm/dL', reference_range: '2.3 - 3.5', min_value: 2.3, max_value: 3.5, method: 'Calculated' },
        { name: 'A : G RATIO', unit: 'RATIO', reference_range: '1.0 - 1.2', min_value: 1.0, max_value: 1.2, method: 'Calculated' },
    ],
    KFT: [
        { name: 'Urea', unit: 'mg/dL', reference_range: '13.00 - 43.00', min_value: 13.0, max_value: 43.0, method: 'Urease UV' },
        { name: 'Creatinine', unit: 'mg/dL', reference_range: '0.60 - 1.30', min_value: 0.6, max_value: 1.3, method: 'Modified Jaffe, Kinetic' },
        { name: 'Uric Acid', unit: 'mg/dL', reference_range: '3.5 - 7.2', min_value: 3.5, max_value: 7.2, method: 'Uricase' },
        { name: 'Calcium', unit: 'mg/dL', reference_range: '8.50 - 10.50', min_value: 8.5, max_value: 10.5, method: 'Arsenazo III' },
        { name: 'Phosphorus', unit: 'mg/dL', reference_range: '2.4 - 5.1', min_value: 2.4, max_value: 5.1, method: 'Molybdate UV' },
        { name: 'Alkaline Phosphatase (ALP)', unit: 'U/L', reference_range: '30.00 - 120.00', min_value: 30, max_value: 120, method: 'IFCC-AMP' },
        { name: 'Total Protein', unit: 'g/dL', reference_range: '5.70 - 8.20', min_value: 5.7, max_value: 8.2, method: 'Biuret' },
        { name: 'Albumin', unit: 'g/dL', reference_range: '3.20 - 4.80', min_value: 3.2, max_value: 4.8, method: 'BCG' },
        { name: 'Sodium', unit: 'mEq/L', reference_range: '135.00 - 145.00', min_value: 135, max_value: 145, method: 'Indirect ISE' },
        { name: 'Potassium', unit: 'mEq/L', reference_range: '3.50 - 5.00', min_value: 3.5, max_value: 5.0, method: 'Indirect ISE' },
        { name: 'Chloride', unit: 'mEq/L', reference_range: '98.00 - 107.00', min_value: 98, max_value: 107, method: 'Indirect ISE' },
    ],
    FBS: [
        { name: 'GLUCOSE, FASTING, PLASMA', unit: 'mg/dL', reference_range: '70.00 - 100.00', min_value: 70, max_value: 100, method: 'Hexokinase' },
    ],
    CRP: [
        { name: 'C-REACTIVE PROTEIN', unit: 'mg/dL', reference_range: '0.0 - 5', min_value: 0, max_value: 5, method: 'Immunoturbidimetry' },
    ],
    WIDAL: [
        { name: 'S. Typhi "O"', unit: '', reference_range: '(+) / (-)', method: 'Slide Agglutination' },
        { name: 'S. Typhi "H"', unit: '', reference_range: '(+) / (-)', method: 'Slide Agglutination' },
        { name: 'S. Para Typhi "A H"', unit: '', reference_range: '(+) / (-)', method: 'Slide Agglutination' },
        { name: 'S. Para Typhi "B H"', unit: '', reference_range: '(+) / (-)', method: 'Slide Agglutination' },
    ],
};

/** Default test category for each grouped panel */
export const PANEL_TEST_CATEGORIES = {
    CBC: { code: 'CBC', name: 'Complete Blood Count (CBC)', description: 'Complete blood count and hematology panels' },
    LFT: { code: 'LFT', name: 'Liver Function Test (LFT)', description: 'Liver function test panels' },
    KFT: { code: 'KFT', name: 'Kidney Function Test (KFT)', description: 'Kidney function test panels' },
    FBS: { code: 'FBS', name: 'Fasting Blood Sugar (FBS)', description: 'Fasting blood sugar and glucose tests' },
    CRP: { code: 'CRP', name: 'C-Reactive Protein (CRP)', description: 'C-reactive protein and inflammatory markers' },
    WIDAL: { code: 'WIDAL', name: 'Widal Test', description: 'Typhoid fever Widal agglutination test' },
};

export const PANEL_CATEGORY_CODES = {
    CBC: 'CBC',
    LFT: 'LFT',
    KFT: 'KFT',
    FBS: 'FBS',
    CRP: 'CRP',
    WIDAL: 'WIDAL',
};

/** Lab test code / category code → panel sequence key */
export const PANEL_CODE_ALIASES = {
    CBC_PANEL: 'CBC',
    FBC: 'FBS',
};

export const GROUPED_PANELS = {
    CBC: {
        name: 'Complete Blood Count (CBC)',
        code: 'CBC',
        category_code: 'CBC',
        sample_type: 'EDTA Blood',
        method: 'Automated Hematology Analyzer',
        price: 350,
    },
    LFT: {
        name: 'Liver Function Test (LFT)',
        code: 'LFT',
        category_code: 'LFT',
        sample_type: 'Serum',
        method: 'Photometry',
        price: 600,
    },
    KFT: {
        name: 'Kidney Function Test (KFT)',
        code: 'KFT',
        category_code: 'KFT',
        sample_type: 'Serum (2 ml)',
        method: 'Automated Chemistry Analyzer',
        price: 550,
    },
    FBS: {
        name: 'Fasting Blood Sugar (FBS)',
        code: 'FBS',
        category_code: 'FBS',
        sample_type: 'Fluoride Plasma',
        method: 'Hexokinase',
        price: 80,
    },
    CRP: {
        name: 'C-Reactive Protein (CRP)',
        code: 'CRP',
        category_code: 'CRP',
        sample_type: 'Serum',
        method: 'Immunoturbidimetry',
        price: 400,
    },
    WIDAL: {
        name: 'Widal Test',
        code: 'WIDAL',
        category_code: 'WIDAL',
        sample_type: 'Serum',
        method: 'Slide Agglutination',
        price: 350,
    },
};

const PANEL_NAME_ALIASES = {
    CBC: {
        wbc: 0, 'wbc count': 0, 'lymph#': 1, lymph: 1, 'mid#': 2, mid: 2, 'gran#': 3, gran: 3,
        'lymph%': 4, 'lymphocyte%': 4, 'mid%': 5, 'gran%': 6, 'granulocyte%': 6,
        hemoglobin: 7, haemoglobin: 7, hgb: 7, hb: 7, rbc: 8, 'rbc count': 8, hct: 9, pcv: 9,
        mcv: 10, mch: 11, mchc: 12, 'rdw-cv': 13, rdwcv: 13, 'rdw-sd': 14, rdwsd: 14, 'rwd-sd': 14,
        platelet: 15, plt: 15, 'platelet count': 15, mpv: 16, pdw: 17, pct: 18,
    },
    LFT: {
        'bilirubin total': 0, 'total bilirubin': 0, 'bilirubin  direct': 1, 'bilirubin direct': 1,
        'bilirubin indirect': 2, 'bilirubin  indirect': 2, sgpt: 3, alt: 3, 'sgpt/alt': 3,
        sgot: 4, ast: 4, 'sgot/ast': 4, 'sgot/sgpt ratio': 5, 'ratio of ast to alt': 5,
        'alkaline phosphatase': 6, alp: 6, ggt: 7, 'gamma glutamyl transferase (ggt)': 7,
        'total proteins': 8, 'total protein': 8, albumin: 9, globulin: 10, 'a : g ratio': 11,
        'a:g ratio': 11, 'albumin:globulin ratio': 11,
    },
    KFT: {
        urea: 0, 'blood urea': 0, creatinine: 1, 'serum creatinine': 1,
        'uric acid': 2, calcium: 3, phosphorus: 4,
        'alkaline phosphatase (alp)': 5, alp: 5, 'total protein': 6,
        albumin: 7, sodium: 8, 'sodium(na*)': 8, potassium: 9, 'potassium(k*)': 9,
        chloride: 10, 'chloride(cl-)': 10,
    },
    FBS: {
        'glucose,fasting,plasma': 0, 'glucose, fasting, plasma': 0, fbs: 0, 'fasting blood sugar': 0,
    },
    CRP: {
        'c-reactive protein': 0, crp: 0, 'c reactive protein': 0,
    },
    WIDAL: {
        's. typhi "o"': 0, 's typhi o': 0, 's. typhi "h"': 1, 's typhi h': 1,
        's. para typhi "a h"': 2, 's para typhi a h': 2,
        's. para typhi "b h"': 3, 's para typhi b h': 3,
    },
};

export function resolvePanelKey(codeOrCategory) {
    if (!codeOrCategory) return null;
    const key = String(codeOrCategory).toUpperCase();
    return PANEL_CODE_ALIASES[key] || (PANEL_PARAMETERS[key] ? key : null);
}

export function panelParameterOrderIndex(testName, panelKey) {
    const key = resolvePanelKey(panelKey);
    if (!key) return 999;

    const normalized = String(testName || '').trim().toLowerCase();
    const aliases = PANEL_NAME_ALIASES[key] || {};
    if (normalized in aliases) return aliases[normalized];

    const canonical = PANEL_PARAMETERS[key].findIndex(
        (p) => p.name.toLowerCase() === normalized,
    );
    return canonical >= 0 ? canonical : 999;
}

export function sortRowsByPanelSequence(rows, panelKey) {
    const key = resolvePanelKey(panelKey);
    if (!key || !PANEL_PARAMETERS[key]) return rows;

    return [...rows].sort((a, b) => {
        const orderDiff = panelParameterOrderIndex(a.testName, key) - panelParameterOrderIndex(b.testName, key);
        if (orderDiff !== 0) return orderDiff;
        return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    });
}

/** @deprecated use sortRowsByPanelSequence(rows, 'CBC') */
export function sortRowsByCbcSequence(rows) {
    return sortRowsByPanelSequence(rows, 'CBC');
}

export const CBC_PARAMETERS = PANEL_PARAMETERS.CBC;
