import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import AppLayout from '../../components/AppLayout';
import StatusBadge from '../../components/StatusBadge';
import { testCategoryService } from '../../services/api';

export default function TestCategoryView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [item, setItem] = useState(null);

    useEffect(() => {
        testCategoryService.get(id).then(({ data }) => setItem(data.data)).catch(() => navigate('/test-categories'));
    }, [id, navigate]);

    if (!item) return <AppLayout><p>Loading...</p></AppLayout>;

    return (
        <AppLayout>
            <div className="page-header">
                <div>
                    <h1 className="page-title">{item.name}</h1>
                    <p className="text-muted">{item.code}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button label="Edit" icon="pi pi-pencil" onClick={() => navigate(`/test-categories/${id}/edit`)} />
                    <Button label="Back" severity="secondary" outlined onClick={() => navigate('/test-categories')} />
                </div>
            </div>
            <Card>
                <div className="detail-grid">
                    <div className="detail-item"><label>Status</label><p><StatusBadge status={item.status} /></p></div>
                    <div className="detail-item"><label>Tests Count</label><p>{item.tests_count || 0}</p></div>
                    <div className="detail-item full-width"><label>Description</label><p>{item.description || '—'}</p></div>
                </div>
            </Card>
        </AppLayout>
    );
}
