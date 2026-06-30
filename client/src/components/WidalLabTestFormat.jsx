import { WIDAL_DILUTIONS, WIDAL_DEFAULT_ANTIGENS } from '../utils/widal';

export default function WidalLabTestFormat({ parameters = [] }) {
    const antigens = parameters.length
        ? [...parameters].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        : WIDAL_DEFAULT_ANTIGENS.map((name, index) => ({ name, sort_order: index }));

    return (
        <div className="widal-lab-format">
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
                        <td className="widal-lab-positive-sample">POSITIVE / NEGATIVE</td>
                    </tr>
                </tbody>
            </table>

            <table className="widal-lab-table widal-lab-grid">
                <thead>
                    <tr>
                        <th className="widal-antigen-col">Investigation</th>
                        {WIDAL_DILUTIONS.map((d) => (
                            <th key={d}>{d}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {antigens.map((row, index) => (
                        <tr key={row.id || index}>
                            <td className="widal-antigen">{row.name}</td>
                            {WIDAL_DILUTIONS.map((d) => (
                                <td key={d} className="widal-cell-sample">(+)</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="widal-lab-note">S. TYPHI O UPTO 1:160 DILUTION</div>
            <div className="widal-lab-end">******* END OF REPORT *******</div>
        </div>
    );
}
