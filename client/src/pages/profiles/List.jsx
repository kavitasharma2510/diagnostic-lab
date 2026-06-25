import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Badge } from 'primereact/badge';
import AppLayout from '../../components/AppLayout';
import StatusBadge from '../../components/StatusBadge';
import { profileService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function ProfileList() {
    const navigate = useNavigate();
    const toast = useToast();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

    async function load() {
        setLoading(true);
        try {
            const { data } = await profileService.list({ search: search || undefined, per_page: 50 });
            setItems(data.data);
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to load profiles');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); }, []);

    return (
        <AppLayout>
            <div className="page-header">
                <div><h1 className="page-title">Profiles / Packages</h1></div>
                <Button label="Add Profile" icon="pi pi-plus" onClick={() => navigate('/profiles/create')} />
            </div>
            <Card>
                <div className="filter-bar">
                    <InputText placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} />
                    <Button label="Search" onClick={load} />
                </div>
                <DataTable value={items} loading={loading}>
                    <Column field="code" header="Code" />
                    <Column field="name" header="Name" />
                    <Column header="Price" body={(r) => `₹${r.price}`} />
                    <Column header="Tests" body={(r) => <Badge value={r.tests_count || 0} />} />
                    <Column header="Status" body={(r) => <StatusBadge status={r.status} />} />
                    <Column header="Actions" body={(r) => (
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                            <Button icon="pi pi-eye" text onClick={() => navigate(`/profiles/${r.id}`)} />
                            <Button icon="pi pi-pencil" text onClick={() => navigate(`/profiles/${r.id}/edit`)} />
                        </div>
                    )} />
                </DataTable>
            </Card>
        </AppLayout>
    );
}
