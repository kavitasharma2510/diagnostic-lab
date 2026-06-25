import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { PickList } from 'primereact/picklist';
import AppLayout from '../../components/AppLayout';
import { profileService, labTestService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function ProfileEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [pickList, setPickList] = useState([[], []]);
    const [form, setForm] = useState({ name: '', code: '', price: 0, description: '', status: 'active' });

    useEffect(() => {
        labTestService.list({ per_page: 200, status: 'active' }).then(async ({ data }) => {
            const all = data.data;
            const profile = (await profileService.get(id)).data.data;
            setForm({
                name: profile.name,
                code: profile.code,
                price: Number(profile.price),
                description: profile.description || '',
                status: profile.status,
            });
            const selected = profile.tests || [];
            const selectedIds = selected.map((t) => t.id);
            setPickList([all.filter((t) => !selectedIds.includes(t.id)), selected]);
        }).catch(() => navigate('/profiles'));
    }, [id, navigate]);

    async function submit(e) {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = { ...form, test_ids: pickList[1].map((t) => t.id) };
            await profileService.update(id, payload);
            toast.success('Profile saved');
            navigate(`/profiles/${id}`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Save failed');
        } finally {
            setLoading(false);
        }
    }

    return (
        <AppLayout>
            <div className="page-header"><h1 className="page-title">Edit Profile</h1></div>
            <Card>
                <form onSubmit={submit}>
                    <div className="form-grid">
                        <div className="form-field"><label>Name</label><InputText value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                        <div className="form-field"><label>Code</label><InputText value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
                        <div className="form-field"><label>Price</label><InputNumber value={form.price} onValueChange={(e) => setForm({ ...form, price: e.value })} mode="currency" currency="INR" locale="en-IN" /></div>
                        <div className="form-field full-width"><label>Description</label><InputTextarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
                    </div>
                    <div style={{ marginTop: '1.5rem' }}>
                        <h3>Select & Order Tests</h3>
                        <p className="text-muted">Move tests to the right — order is saved as profile test order.</p>
                        <PickList
                            source={pickList[0]}
                            target={pickList[1]}
                            onChange={(e) => setPickList([e.source, e.target])}
                            itemTemplate={(item) => <div><strong>{item.name}</strong><div className="text-muted">{item.code}</div></div>}
                            sourceHeader="Available"
                            targetHeader="Selected"
                            filter
                            filterBy="name,code"
                        />
                    </div>
                    <div className="form-actions">
                        <Button type="submit" label="Save" loading={loading} />
                        <Button type="button" label="Cancel" severity="secondary" outlined onClick={() => navigate(-1)} />
                    </div>
                </form>
            </Card>
        </AppLayout>
    );
}
