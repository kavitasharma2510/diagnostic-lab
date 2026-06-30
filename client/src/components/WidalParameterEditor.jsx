import { InputText } from 'primereact/inputtext';
import WidalLabTestFormat from './WidalLabTestFormat';

export default function WidalParameterEditor({ parameters, onChange }) {
    function updateName(index, name) {
        const next = [...parameters];
        next[index] = { ...next[index], name };
        onChange(next);
    }

    return (
        <div className="widal-param-editor">
            <p className="widal-entry-hint">
                Widal uses a dilution grid report. Antigens are fixed rows; results are entered as (+) or (-) at each dilution when reporting.
            </p>

            <WidalLabTestFormat parameters={parameters} />

            <div className="widal-antigen-fields">
                <h4>Antigen names (report row order)</h4>
                {parameters.map((p, index) => (
                    <div key={p.id || index} className="widal-antigen-field">
                        <label>{`Row ${index + 1}`}</label>
                        <InputText
                            value={p.name}
                            onChange={(e) => updateName(index, e.target.value)}
                            className="w-full"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
