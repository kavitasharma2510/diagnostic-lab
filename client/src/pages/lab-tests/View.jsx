import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import AppLayout from '../../components/AppLayout';
import StatusBadge from '../../components/StatusBadge';
import { labTestService } from '../../services/api';

export default function LabTestView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [item, setItem] = useState(null);

    useEffect(() => {
        labTestService.get(id).then(({ data }) => setItem(data.data)).catch(() => navigate('/lab-tests'));
    }, [id, navigate]);

    if (!item) return <AppLayout><p>Loading...</p></AppLayout>;

    return (
        <AppLayout>
            <div className="page-header">
                <div><h1 className="page-title">{item.name}</h1><p className="text-muted">{item.code}</p></div>
                <Button label="Edit" onClick={() => navigate(`/lab-tests/${id}/edit`)} />
            </div>
            <Card>
                <div className="detail-grid">
                    <div className="detail-item"><label>Category</label><p>{item.category?.name}</p></div>
                    <div className="detail-item"><label>Sample</label><p>{item.sample_type}</p></div>
                    <div className="detail-item"><label>Type</label><p><Tag value={item.report_type} /></p></div>
                    <div className="detail-item"><label>Price</label><p>₹{item.price}</p></div>
                    <div className="detail-item"><label>Status</label><p><StatusBadge status={item.status} /></p></div>
                </div>
            </Card>
            {item.report_type === 'grouped' && item.parameters?.length > 0 && (
                <Card title="Parameters" style={{ marginTop: '1rem' }}>
                    <DataTable value={item.parameters}>
                        <Column field="name" header="Name" />
                        <Column field="unit" header="Unit" />
                        <Column field="reference_range" header="Reference" />
                        <Column field="sort_order" header="Order" />
                    </DataTable>
                </Card>
            )}
        </AppLayout>
    );
}
