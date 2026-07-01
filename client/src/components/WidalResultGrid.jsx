import {
    WIDAL_DILUTIONS,
    parseWidalResult,
    serializeWidalResult,
    normalizeReaction,
    computeWidalOverall,
    buildWidalNote,
} from '../utils/widal';

function ReactionToggle({ value, onSelect, disabled }) {
    const current = normalizeReaction(value);
    const isPlus = current === '(+)';
    const isMinus = current === '(-)';

    return (
        <div className="widal-reaction-cell">
            <button
                type="button"
                className={`widal-reaction-btn ${isPlus ? 'active-plus' : ''}`}
                onClick={() => onSelect(isPlus ? '' : '(+)')}
                disabled={disabled}
                title="Positive"
            >
                (+)
            </button>
            <button
                type="button"
                className={`widal-reaction-btn ${isMinus ? 'active-minus' : ''}`}
                onClick={() => onSelect(isMinus ? '' : '(-)')}
                disabled={disabled}
                title="Negative"
            >
                (-)
            </button>
        </div>
    );
}

export default function WidalResultGrid({ rows, onChange, disabled = false }) {
    const overall = computeWidalOverall(rows);
    const note = buildWidalNote(rows);

    function updateCell(row, dilution, value) {
        const dilutions = { ...parseWidalResult(row.result_value), [dilution]: value };
        onChange(row.id, serializeWidalResult(dilutions));
    }

    return (
        <div className="widal-entry-format">
            <div className="widal-lab-title">** REPORT ON THE WIDAL TEST</div>

            <table className="widal-lab-table widal-lab-summary">
                <thead>
                    <tr>
                        <th>Investigation</th>
                        <th>Result</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>WIDAL TEST</td>
                        <td className={`widal-overall-live ${overall === 'POSITIVE' ? 'positive' : ''}`}>
                            {overall}
                        </td>
                    </tr>
                </tbody>
            </table>

            <div className="widal-grid-wrap">
                <table className="widal-grid widal-entry-grid">
                    <thead>
                        <tr>
                            <th className="widal-antigen-col">Investigation</th>
                            {WIDAL_DILUTIONS.map((d) => (
                                <th key={d}>{d}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => {
                            const dilutions = parseWidalResult(row.result_value);
                            return (
                                <tr key={row.id}>
                                    <td className="widal-antigen">{row.test_name}</td>
                                    {WIDAL_DILUTIONS.map((d) => (
                                        <td key={d}>
                                            <ReactionToggle
                                                value={dilutions[d]}
                                                onSelect={(val) => updateCell(row, d, val)}
                                                disabled={disabled}
                                            />
                                        </td>
                                    ))}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {note && <div className="widal-lab-note">{note}</div>}
            <p className="widal-entry-hint">Click <strong>(+)</strong> or <strong>(-)</strong> for each dilution as needed. Cells can be left blank; click again to clear.</p>
        </div>
    );
}
