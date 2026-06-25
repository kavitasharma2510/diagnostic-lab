import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import AppLayout from '../../components/AppLayout';
import { sampleCollectionService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function SampleCollect() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [remarks, setRemarks] = useState('');
    const [pendingGroup, setPendingGroup] = useState(null);

    const billId = searchParams.get('bill_id');
    const sampleType = searchParams.get('sample_type');
    const billTestIds = (searchParams.get('bill_test_ids') || '').split(',').filter(Boolean);

    useEffect(() => {
        if (!billId) return;
        sampleCollectionService.listPending({ bill_no: '' }).then(({ data }) => {
            const group = data.data.find(
                (g) => g.bill_id === billId && g.sample_type === sampleType
            );
            setPendingGroup(group || {
                bill_id: billId,
                sample_type: sampleType,
                bill_test_ids: billTestIds,
                tests: [],
            });
        });
    }, [billId, sampleType]);

    async function submit(e) {
        e.preventDefault();
        if (!billId || !sampleType || !billTestIds.length) {
            toast.error('Invalid collection data. Start from Pending Samples.');
            return;
        }

        setLoading(true);
        try {
            const { data } = await sampleCollectionService.collect({
                bill_id: billId,
                sample_type: sampleType,
                bill_test_ids: billTestIds,
                remarks: remarks || null,
            });
            toast.success('Sample collected successfully');
            navigate(`/samples/${data.data.id}`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Collection failed');
        } finally {
            setLoading(false);
        }
    }

    if (!billId) {
        return (
            <AppLayout>
                <Card>
                    <p>Select a pending sample group from the pending list.</p>
                    <Button label="Go to Pending Samples" onClick={() => navigate('/samples/pending')} />
                </Card>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="page-header">
                <h1 className="page-title">Sample Collection</h1>
            </div>
            <Card>
                <form onSubmit={submit}>
                    <div className="detail-grid" style={{ marginBottom: '1rem' }}>
                        <div className="detail-item"><label>Bill ID</label><p>{billId}</p></div>
                        <div className="detail-item"><label>Sample Type</label><p>{sampleType}</p></div>
                        {pendingGroup?.patient && (
                            <div className="detail-item"><label>Patient</label><p>{pendingGroup.patient.name}</p></div>
                        )}
                        {pendingGroup?.bill_no && (
                            <div className="detail-item"><label>Bill No</label><p>{pendingGroup.bill_no}</p></div>
                        )}
                    </div>

                    {pendingGroup?.tests?.length > 0 && (
                        <DataTable value={pendingGroup.tests} style={{ marginBottom: '1rem' }}>
                            <Column field="test_name" header="Test" />
                            <Column field="code" header="Code" />
                        </DataTable>
                    )}

                    <div className="form-field full-width">
                        <label>Remarks</label>
                        <InputTextarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3} autoResize />
                    </div>

                    <div className="form-actions">
                        <Button type="submit" label="Mark as Collected" icon="pi pi-check" loading={loading} />
                        <Button type="button" label="Cancel" severity="secondary" outlined onClick={() => navigate('/samples/pending')} />
                    </div>
                </form>
            </Card>
        </AppLayout>
    );
}
