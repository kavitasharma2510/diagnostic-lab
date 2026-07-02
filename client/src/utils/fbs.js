export const FBS_REFERENCE_ROWS = [
    { fasting: '<100', pp: '<140', diagnosis: 'Normal' },
    { fasting: '100 to 125', pp: '140 to 199', diagnosis: 'Pre Diabetes' },
    { fasting: '>126', pp: '>200', diagnosis: 'Diabetes' },
];

export function isFbsRelatedResult(row) {
    const name = String(row?.test_name || '').toLowerCase();
    const code = String(row?.lab_test_code || row?.lab_test?.code || '').toLowerCase();
    const category = String(row?.category_code || row?.lab_test?.category?.code || '').toLowerCase();

    if (code === 'fbs' || category === 'fbs') return true;
    if (name.includes('fbs')) return true;
    if (name.includes('fasting') && (name.includes('glucose') || name.includes('sugar'))) return true;
    if (name.includes('blood sugar pp') || name.includes('pp glucose') || name.includes('post prandial')) return true;

    return false;
}

export function hasFbsResults(results) {
    return (results || []).some(isFbsRelatedResult);
}
