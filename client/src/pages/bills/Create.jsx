import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { InputText } from 'primereact/inputtext';
import AppLayout from '../../components/AppLayout';
import { billService, patientService, labTestService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const paymentOptions = [
    { label: 'Unpaid', value: 'Unpaid' },
    { label: 'Paid', value: 'Paid' },
];

export default function BillCreate() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [patients, setPatients] = useState([]);
    const [labTests, setLabTests] = useState([]);
    const [form, setForm] = useState({
        patient_id: searchParams.get('patient_id') || null,
        lab_test_ids: [],
        payment_status: 'Unpaid',
        referred_doctor: '',
    });

    useEffect(() => {
        Promise.all([
            patientService.list({ per_page: 200 }),
            labTestService.list({ per_page: 200, status: 'active' }),
        ]).then(([patientsRes, testsRes]) => {
            setPatients(patientsRes.data.data);
            setLabTests(testsRes.data.data);
        });
    }, []);

    useEffect(() => {
        if (form.patient_id && patients.length) {
            const patient = patients.find((p) => p.id === form.patient_id);
            if (patient?.referring_doctor && !form.referred_doctor) {
                setForm((prev) => ({ ...prev, referred_doctor: patient.referring_doctor }));
            }
        }
    }, [form.patient_id, patients]);

    const estimatedTotal = useMemo(() => {
        let total = 0;
        for (const id of form.lab_test_ids) {
            const test = labTests.find((t) => t.id === id);
            if (test) total += Number(test.price || 0);
        }
        return total;
    }, [form.lab_test_ids, labTests]);

    const patientOptions = patients.map((p) => ({
        label: `${p.patient_no} — ${p.name}`,
        value: p.id,
    }));

    async function submit(e) {
        e.preventDefault();
        setLoading(true);
        setErrors({});
        try {
            const response = await billService.create(form);
            toast.success('Bill created — tests are pending sample collection');
            navigate(`/bills/${response.data.data.id}`);
        } catch (err) {
            setErrors(err.response?.data?.errors || {});
            toast.error(err.response?.data?.message || 'Save failed');
        } finally {
            setLoading(false);
        }
    }

    return (
        <AppLayout>
            <div className="page-header"><h1 className="page-title">Create Bill</h1></div>
            <Card>
                <form onSubmit={submit}>
                    <div className="form-grid">
                        <div className="form-field full-width">
                            <label>Patient <span className="required">*</span></label>
                            <Dropdown
                                value={form.patient_id}
                                options={patientOptions}
                                onChange={(e) => setForm({ ...form, patient_id: e.value })}
                                placeholder="Select patient"
                                filter
                                className={errors.patient_id ? 'p-invalid' : ''}
                            />
                        </div>
                        <div className="form-field full-width">
                            <label>Lab Tests</label>
                            <MultiSelect
                                value={form.lab_test_ids}
                                options={labTests}
                                optionLabel="name"
                                optionValue="id"
                                onChange={(e) => setForm({ ...form, lab_test_ids: e.value })}
                                placeholder="Select individual tests"
                                filter
                                display="chip"
                                itemTemplate={(item) => (
                                    <div>
                                        <strong>{item.name}</strong>
                                        <span className="text-muted"> — ₹{item.price}</span>
                                    </div>
                                )}
                            />
                        </div>
                        <div className="form-field">
                            <label>Payment Status</label>
                            <Dropdown
                                value={form.payment_status}
                                options={paymentOptions}
                                onChange={(e) => setForm({ ...form, payment_status: e.value })}
                            />
                        </div>
                        <div className="form-field">
                            <label>Referring Doctor</label>
                            <InputText
                                value={form.referred_doctor}
                                onChange={(e) => setForm({ ...form, referred_doctor: e.target.value })}
                                placeholder="Optional"
                            />
                        </div>
                        <div className="form-field">
                            <label>Estimated Total</label>
                            <p style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>₹{estimatedTotal.toFixed(2)}</p>
                        </div>
                    </div>
                    <div className="form-actions">
                        <Button type="submit" label="Create Bill" icon="pi pi-check" loading={loading} />
                        <Button type="button" label="Cancel" severity="secondary" outlined onClick={() => navigate('/bills')} />
                    </div>
                </form>
            </Card>
        </AppLayout>
    );
}
