import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import AppLayout from '../../components/AppLayout';
import { labTestService, testCategoryService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const emptyParam = () => ({ name: '', unit: '', reference_range: '', min_value: null, max_value: null, method: '', sort_order: 0, status: 'active' });

export default function LabTestCreate() {
    const navigate = useNavigate();
    const toast = useToast();
    const [categories, setCategories] = useState([]);
    const [parameters, setParameters] = useState([]);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        test_category_id: null, name: '', code: '', sample_type: 'Serum', report_type: 'single',
        unit: '', price: 0, method: '', reference_range: '', min_value: null, max_value: null, sort_order: 0, status: 'active',
    });

    useEffect(() => {
        testCategoryService.list({ per_page: 100, status: 'active' }).then(({ data }) => setCategories(data.data));
    }, []);

    async function submit(e) {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = { ...form };
            if (form.report_type === 'grouped') {
                payload.parameters = parameters;
                payload.unit = null;
                payload.reference_range = null;
            }
            const { data } = await labTestService.create(payload);
            toast.success('Test created');
            navigate(`/lab-tests/${data.data.id}`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Save failed');
        } finally {
            setLoading(false);
        }
    }

    return (
        <AppLayout>
            <div className="page-header"><h1 className="page-title">Create Lab Test</h1></div>
            <Card>
                <form onSubmit={submit}>
                    <div className="form-grid">
                        <div className="form-field"><label>Category</label><Dropdown value={form.test_category_id} options={categories} optionLabel="name" optionValue="id" onChange={(e) => setForm({ ...form, test_category_id: e.value })} /></div>
                        <div className="form-field"><label>Name</label><InputText value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                        <div className="form-field"><label>Code</label><InputText value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
                        <div className="form-field"><label>Sample Type</label><InputText value={form.sample_type} onChange={(e) => setForm({ ...form, sample_type: e.target.value })} /></div>
                        <div className="form-field"><label>Report Type</label><Dropdown value={form.report_type} options={[{ label: 'Single', value: 'single' }, { label: 'Grouped', value: 'grouped' }]} onChange={(e) => setForm({ ...form, report_type: e.value })} /></div>
                        <div className="form-field"><label>Price</label><InputNumber value={form.price} onValueChange={(e) => setForm({ ...form, price: e.value })} mode="currency" currency="INR" locale="en-IN" /></div>
                    </div>
                    {form.report_type === 'grouped' && (
                        <div style={{ marginTop: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <h3>Parameters</h3>
                                <Button type="button" label="Add Parameter" icon="pi pi-plus" outlined onClick={() => setParameters([...parameters, emptyParam()])} />
                            </div>
                            {parameters.map((p, i) => (
                                <div key={p.id || i} style={{ padding: '1rem', background: '#f8fafc', borderRadius: 8, marginBottom: '0.75rem' }}>
                                    <div className="form-grid">
                                        <div className="form-field"><label>Name</label><InputText value={p.name} onChange={(e) => { const n = [...parameters]; n[i].name = e.target.value; setParameters(n); }} /></div>
                                        <div className="form-field"><label>Unit</label><InputText value={p.unit} onChange={(e) => { const n = [...parameters]; n[i].unit = e.target.value; setParameters(n); }} /></div>
                                        <div className="form-field"><label>Reference Range</label><InputText value={p.reference_range} onChange={(e) => { const n = [...parameters]; n[i].reference_range = e.target.value; setParameters(n); }} /></div>
                                    </div>
                                    <Button type="button" icon="pi pi-trash" severity="danger" text onClick={() => setParameters(parameters.filter((_, idx) => idx !== i))} />
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="form-actions">
                        <Button type="submit" label="Save" loading={loading} />
                        <Button type="button" label="Cancel" severity="secondary" outlined onClick={() => navigate(-1)} />
                    </div>
                </form>
            </Card>
        </AppLayout>
    );
}
