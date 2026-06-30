import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { confirmDialog } from 'primereact/confirmdialog';
import AppLayout from '../../components/AppLayout';
import PageHeader from '../../components/PageHeader';
import PageLoader from '../../components/PageLoader';
import StatusBadge from '../../components/StatusBadge';
import { testCategoryService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import WidalLabTestFormat from '../../components/WidalLabTestFormat';
import { isWidalCode } from '../../utils/widal';

export default function TestCategoryView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [item, setItem] = useState(null);

    useEffect(() => {
        testCategoryService.get(id).then(({ data }) => setItem(data.data)).catch(() => navigate('/test-categories'));
    }, [id, navigate]);

    if (!item) return <AppLayout><PageLoader /></AppLayout>;

    const groupedPanel = item.lab_tests?.find((t) => t.report_type === 'grouped');
    const parameterRows = groupedPanel?.parameters || [];

    function confirmDelete() {
        confirmDialog({
            message: `Delete category "${item.name}"? Categories with linked tests cannot be deleted.`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                try {
                    await testCategoryService.delete(id);
                    toast.success('Category deleted successfully');
                    navigate('/test-categories');
                } catch (e) {
                    toast.error(e.response?.data?.errors?.category?.[0] || e.response?.data?.message || 'Delete failed');
                }
            },
        });
    }

    return (
        <AppLayout>
            <PageHeader title={item.name} subtitle={item.code}>
                <Button label="Edit" icon="pi pi-pencil" onClick={() => navigate(`/test-categories/${id}/edit`)} />
                <Button label="Delete" icon="pi pi-trash" severity="danger" outlined onClick={confirmDelete} />
                <Button label="Back" severity="secondary" outlined onClick={() => navigate('/test-categories')} />
            </PageHeader>
            <Card className="content-card">
                <div className="detail-grid">
                    <div className="detail-item"><label>Status</label><p><StatusBadge status={item.status} /></p></div>
                    <div className="detail-item"><label>Tests Count</label><p>{item.tests_count || 0}</p></div>
                    <div className="detail-item full-width"><label>Description</label><p>{item.description || '—'}</p></div>
                </div>
            </Card>

            {groupedPanel && parameterRows.length > 0 && (
                <Card style={{ marginTop: '1rem' }}>
                    <h3 style={{ marginTop: 0 }}>{groupedPanel.name}</h3>
                    {isWidalCode(groupedPanel.code) ? (
                        <>
                            <p className="text-muted" style={{ marginBottom: '1rem' }}>
                                Widal dilution grid format — 4 antigens × 6 dilutions
                            </p>
                            <WidalLabTestFormat parameters={parameterRows} />
                        </>
                    ) : (
                        <>
                            <p className="text-muted" style={{ marginBottom: '1rem' }}>
                                {parameterRows.length} parameters in report sequence
                            </p>
                            <DataTable value={parameterRows} size="small">
                                <Column header="#" body={(_, { rowIndex }) => rowIndex + 1} style={{ width: '3rem' }} />
                                <Column field="name" header="Test Name" />
                                <Column field="unit" header="Unit" />
                                <Column field="reference_range" header="Reference Range" />
                            </DataTable>
                        </>
                    )}
                    <Button
                        label={isWidalCode(groupedPanel.code) ? 'Edit Widal Test' : 'Edit Panel'}
                        icon="pi pi-pencil"
                        className="p-button-outlined"
                        style={{ marginTop: '1rem' }}
                        onClick={() => navigate(`/lab-tests/${groupedPanel.id}/edit`)}
                    />
                </Card>
            )}

            {item.lab_tests?.length > 0 && !parameterRows.length && (
                <Card style={{ marginTop: '1rem' }}>
                    <h3 style={{ marginTop: 0 }}>Lab Tests</h3>
                    <DataTable value={item.lab_tests} size="small">
                        <Column field="code" header="Code" />
                        <Column field="name" header="Name" />
                        <Column field="report_type" header="Type" />
                    </DataTable>
                </Card>
            )}
        </AppLayout>
    );
}
