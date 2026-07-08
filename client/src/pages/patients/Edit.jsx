import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import AppLayout from '../../components/AppLayout';
import { patientService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const genderOptions = [
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' },
    { label: 'Other', value: 'Other' },
];

export default function PatientEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [form, setForm] = useState({
        name: '',
        age: null,
        gender: null,
        mobile: '',
        address: '',
        referring_doctor: '',
    });

    useEffect(() => {
        patientService.get(id).then(({ data }) => {
            const p = data.data;
            setForm({
                name: p.name,
                age: p.age,
                gender: p.gender,
                mobile: p.mobile || '',
                address: p.address || '',
                referring_doctor: p.referring_doctor || '',
            });
        }).catch(() => navigate('/patients'));
    }, [id, navigate]);

    function fieldError(name) {
        return errors[name]?.[0];
    }

    async function submit(e) {
        e.preventDefault();
        setLoading(true);
        setErrors({});
        try {
            const payload = {
                name: form.name.trim(),
                age: form.age ?? undefined,
                gender: form.gender || undefined,
                mobile: form.mobile || undefined,
                address: form.address || undefined,
                referring_doctor: form.referring_doctor || undefined,
            };
            await patientService.update(id, payload);
            toast.success('Patient updated');
            navigate(`/patients/${id}`);
        } catch (err) {
            setErrors(err.response?.data?.errors || {});
            toast.error(err.response?.data?.message || 'Update failed');
        } finally {
            setLoading(false);
        }
    }

    return (
        <AppLayout>
            <div className="page-header"><h1 className="page-title">Edit Patient</h1></div>
            <Card>
                <form onSubmit={submit}>
                    <div className="form-grid">
                        <div className="form-field">
                            <label>Name <span className="required">*</span></label>
                            <InputText value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={fieldError('name') ? 'p-invalid' : ''} />
                        </div>
                        <div className="form-field">
                            <label>Age</label>
                            <InputNumber value={form.age} onValueChange={(e) => setForm({ ...form, age: e.value })} min={0} max={150} />
                        </div>
                        <div className="form-field">
                            <label>Gender</label>
                            <Dropdown value={form.gender} options={genderOptions} onChange={(e) => setForm({ ...form, gender: e.value })} placeholder="Select gender" showClear />
                        </div>
                        <div className="form-field">
                            <label>Mobile Number</label>
                            <InputText value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
                        </div>
                        <div className="form-field">
                            <label>Referring Doctor</label>
                            <InputText value={form.referring_doctor} onChange={(e) => setForm({ ...form, referring_doctor: e.target.value })} />
                        </div>
                        <div className="form-field full-width">
                            <label>Address</label>
                            <InputTextarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={3} autoResize />
                        </div>
                    </div>
                    <div className="form-actions">
                        <Button type="submit" label="Save" icon="pi pi-check" loading={loading} />
                        <Button type="button" label="Cancel" severity="secondary" outlined onClick={() => navigate(`/patients/${id}`)} />
                    </div>
                </form>
            </Card>
        </AppLayout>
    );
}
