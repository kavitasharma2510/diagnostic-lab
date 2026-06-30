import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { confirmDialog } from 'primereact/confirmdialog';
import AppLayout from '../../components/AppLayout';
import PageHeader from '../../components/PageHeader';
import PageLoader from '../../components/PageLoader';
import StatusBadge from '../../components/StatusBadge';
import { labTestService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import WidalLabTestFormat from '../../components/WidalLabTestFormat';
import { isWidalCode } from '../../utils/widal';

export default function LabTestView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [item, setItem] = useState(null);

    useEffect(() => {
        labTestService.get(id).then(({ data }) => setItem(data.data)).catch(() => navigate('/lab-tests'));
    }, [id, navigate]);

    if (!item) return <AppLayout><PageLoader /></AppLayout>;

    function confirmDelete() {
        confirmDialog({
            message: `Delete test "${item.name}"? This cannot be undone.`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                try {
                    await labTestService.delete(id);
                    toast.success('Test deleted successfully');
                    navigate('/lab-tests');
                } catch (e) {
                    toast.error(e.response?.data?.errors?.test?.[0] || e.response?.data?.message || 'Delete failed');
                }
            },
        });
    }

    return (
        <AppLayout>
            <PageHeader title={item.name} subtitle={item.code}>
                <Button label="Edit" icon="pi pi-pencil" onClick={() => navigate(`/lab-tests/${id}/edit`)} />
                <Button label="Delete" icon="pi pi-trash" severity="danger" outlined onClick={confirmDelete} />
                <Button label="Back" severity="secondary" outlined onClick={() => navigate('/lab-tests')} />
            </PageHeader>
            <Card className="content-card">
                <div className="detail-grid">
                    <div className="detail-item"><label>Category</label><p>{item.category?.name}</p></div>
                    <div className="detail-item"><label>Sample</label><p>{item.sample_type}</p></div>
                    <div className="detail-item"><label>Type</label><p><Tag value={item.report_type} /></p></div>
                    <div className="detail-item"><label>Price</label><p>₹{item.price}</p></div>
                    <div className="detail-item"><label>Status</label><p><StatusBadge status={item.status} /></p></div>
                </div>
            </Card>
            {item.report_type === 'grouped' && item.parameters?.length > 0 && (
                isWidalCode(item.code) ? (
                    <Card title="Widal Report Format" style={{ marginTop: '1rem' }}>
                        <WidalLabTestFormat parameters={item.parameters} />
                    </Card>
                ) : (
                    <Card title="Parameters" style={{ marginTop: '1rem' }}>
                        <DataTable value={item.parameters}>
                            <Column field="name" header="Name" />
                            <Column field="unit" header="Unit" />
                            <Column field="reference_range" header="Reference" />
                            <Column field="sort_order" header="Order" />
                        </DataTable>
                    </Card>
                )
            )}
        </AppLayout>
    );
}
