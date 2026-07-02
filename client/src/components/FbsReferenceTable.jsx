import { FBS_REFERENCE_ROWS } from '../utils/fbs';

export default function FbsReferenceTable() {
    return (
        <div className="fbs-reference">
            <table className="fbs-ref-table">
                <thead>
                    <tr>
                        <th>Fasting Glucose</th>
                        <th>2 hours PP Glucose</th>
                        <th>Diagnosis</th>
                    </tr>
                </thead>
                <tbody>
                    {FBS_REFERENCE_ROWS.map((row) => (
                        <tr key={row.diagnosis}>
                            <td>{row.fasting}</td>
                            <td>{row.pp}</td>
                            <td>{row.diagnosis}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
