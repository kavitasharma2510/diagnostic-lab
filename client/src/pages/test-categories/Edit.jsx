import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import AppLayout from '../../components/AppLayout';
import { testCategoryService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
];

export default function TestCategoryEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [form, setForm] = useState({ name: '', code: '', description: '', status: 'active' });

    useEffect(() => {
        testCategoryService.get(id).then(({ data }) => {
            const c = data.data;
            setForm({ name: c.name, code: c.code, description: c.description || '', status: c.status });
        }).catch(() => navigate('/test-categories'));
    }, [id, navigate]);

    function fieldError(name) {
        return errors[name]?.[0];
    }

    async function submit(e) {
        e.preventDefault();
        setLoading(true);
        setErrors({});
        try {
            await testCategoryService.update(id, form);
            toast.success('Updated successfully');
            navigate(`/test-categories/${id}`);
        } catch (err) {
            setErrors(err.response?.data?.errors || {});
            toast.error(err.response?.data?.message || 'Validation failed');
        } finally {
            setLoading(false);
        }
    }

    return (
        <AppLayout>
            <div className="page-header"><h1 className="page-title">Edit Test Category</h1></div>
            <Card>
                <form onSubmit={submit}>
                    <div className="form-grid">
                        <div className="form-field">
                            <label>Name <span className="required">*</span></label>
                            <InputText value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={fieldError('name') ? 'p-invalid' : ''} />
                        </div>
                        <div className="form-field">
                            <label>Code <span className="required">*</span></label>
                            <InputText value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className={fieldError('code') ? 'p-invalid' : ''} />
                        </div>
                        <div className="form-field">
                            <label>Status</label>
                            <Dropdown value={form.status} options={statusOptions} onChange={(e) => setForm({ ...form, status: e.value })} />
                        </div>
                        <div className="form-field full-width">
                            <label>Description</label>
                            <InputTextarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} autoResize />
                        </div>
                    </div>
                    <div className="form-actions">
                        <Button type="submit" label="Save" icon="pi pi-check" loading={loading} />
                        <Button type="button" label="Cancel" severity="secondary" outlined onClick={() => navigate(`/test-categories/${id}`)} />
                    </div>
                </form>
            </Card>
        </AppLayout>
    );
}
