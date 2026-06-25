import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import AppLayout from '../../components/AppLayout';
import StatusBadge from '../../components/StatusBadge';
import { profileService } from '../../services/api';

export default function ProfileView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [item, setItem] = useState(null);

    useEffect(() => {
        profileService.get(id).then(({ data }) => setItem(data.data)).catch(() => navigate('/profiles'));
    }, [id, navigate]);

    if (!item) return <AppLayout><p>Loading...</p></AppLayout>;

    const tests = item.tests || [];

    return (
        <AppLayout>
            <div className="page-header">
                <div><h1 className="page-title">{item.name}</h1><p className="text-muted">{item.code}</p></div>
                <Button label="Edit" onClick={() => navigate(`/profiles/${id}/edit`)} />
            </div>
            <Card>
                <div className="detail-grid">
                    <div className="detail-item"><label>Profile Price</label><p>₹{item.price}</p></div>
                    <div className="detail-item"><label>Status</label><p><StatusBadge status={item.status} /></p></div>
                    <div className="detail-item"><label>Tests</label><p>{tests.length}</p></div>
                    <div className="detail-item full-width"><label>Description</label><p>{item.description || '—'}</p></div>
                </div>
            </Card>
            <Card title="Included Tests" style={{ marginTop: '1rem' }}>
                <DataTable value={tests}>
                    <Column header="#" body={(_, o) => o.rowIndex + 1} />
                    <Column field="code" header="Code" />
                    <Column field="name" header="Name" />
                    <Column field="sample_type" header="Sample" />
                    <Column header="Price" body={(r) => `₹${r.price}`} />
                </DataTable>
            </Card>
        </AppLayout>
    );
}
