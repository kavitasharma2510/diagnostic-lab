import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import AppLayout from '../../components/AppLayout';
import { billService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const paymentOptions = [
    { label: 'Unpaid', value: 'Unpaid' },
    { label: 'Paid', value: 'Paid' },
];

export default function BillEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [bill, setBill] = useState(null);
    const [form, setForm] = useState({
        payment_status: 'Unpaid',
        referred_doctor: '',
        remarks: '',
    });

    useEffect(() => {
        billService.get(id).then(({ data }) => {
            const b = data.data;
            setBill(b);
            setForm({
                payment_status: b.payment_status || 'Unpaid',
                referred_doctor: b.referred_doctor || '',
                remarks: b.remarks || '',
            });
        }).catch(() => navigate('/bills'));
    }, [id, navigate]);

    async function submit(e) {
        e.preventDefault();
        setLoading(true);
        try {
            await billService.update(id, form);
            toast.success('Bill updated');
            navigate(`/bills/${id}`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Update failed');
        } finally {
            setLoading(false);
        }
    }

    if (!bill) return <AppLayout><p>Loading...</p></AppLayout>;

    return (
        <AppLayout>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Edit Bill</h1>
                    <p className="text-muted">{bill.bill_no}</p>
                </div>
            </div>
            <Card>
                <p className="text-muted" style={{ marginBottom: '1rem' }}>
                    Tests and total cannot be changed after billing. Update payment status or referring doctor only.
                </p>
                <form onSubmit={submit}>
                    <div className="form-grid">
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
                            />
                        </div>
                        <div className="form-field full-width">
                            <label>Remarks</label>
                            <InputTextarea
                                value={form.remarks}
                                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                                rows={3}
                                autoResize
                            />
                        </div>
                    </div>
                    <div className="form-actions">
                        <Button type="submit" label="Save" icon="pi pi-check" loading={loading} />
                        <Button type="button" label="Cancel" severity="secondary" outlined onClick={() => navigate(`/bills/${id}`)} />
                    </div>
                </form>
            </Card>
        </AppLayout>
    );
}
