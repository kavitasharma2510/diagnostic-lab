import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { Timeline } from 'primereact/timeline';
import AppLayout from '../../components/AppLayout';
import { printBarcodeLabel } from '../../components/BarcodeLabelPrint';
import { sampleCollectionService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const statusSeverity = {
    pending: 'warning',
    collected: 'info',
    processing: 'primary',
    completed: 'success',
    rejected: 'danger',
};

const nextStatusOptions = [
    { label: 'Processing', value: 'processing' },
    { label: 'Completed', value: 'completed' },
];

export default function SampleView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [item, setItem] = useState(null);
    const [rejectVisible, setRejectVisible] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [statusValue, setStatusValue] = useState('processing');
    const [loading, setLoading] = useState(false);

    async function load() {
        try {
            const { data } = await sampleCollectionService.get(id);
            setItem(data.data);
        } catch {
            navigate('/samples');
        }
    }

    useEffect(() => { load(); }, [id]);

    async function handleReject() {
        if (!rejectReason.trim()) {
            toast.error('Rejection reason is required');
            return;
        }
        setLoading(true);
        try {
            await sampleCollectionService.reject(id, { rejection_reason: rejectReason });
            toast.success('Sample rejected');
            setRejectVisible(false);
            load();
        } catch (e) {
            toast.error(e.response?.data?.message || 'Reject failed');
        } finally {
            setLoading(false);
        }
    }

    async function updateStatus() {
        setLoading(true);
        try {
            await sampleCollectionService.updateStatus(id, { status: statusValue });
            toast.success(`Status updated to ${statusValue}`);
            load();
        } catch (e) {
            toast.error(e.response?.data?.message || 'Status update failed');
        } finally {
            setLoading(false);
        }
    }

    async function printLabel() {
        try {
            const { data } = await sampleCollectionService.barcodeLabel(id);
            printBarcodeLabel(data.data);
        } catch {
            toast.error('Failed to load barcode label');
        }
    }

    if (!item) return <AppLayout><p>Loading...</p></AppLayout>;

    return (
        <AppLayout>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Sample Details</h1>
                    <p className="text-muted">{item.sample_no}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <Button label="Print Barcode" icon="pi pi-print" onClick={printLabel} />
                    {item.status !== 'rejected' && (
                        <Button label="Reject" icon="pi pi-times" severity="danger" outlined onClick={() => setRejectVisible(true)} />
                    )}
                    <Button label="Back" severity="secondary" outlined onClick={() => navigate('/samples')} />
                </div>
            </div>

            <Card className="mb-3">
                <div className="detail-grid">
                    <div className="detail-item"><label>Barcode</label><p style={{ fontFamily: 'monospace', fontSize: '1.1rem' }}>{item.barcode}</p></div>
                    <div className="detail-item"><label>Status</label><p><Tag value={item.status} severity={statusSeverity[item.status]} /></p></div>
                    <div className="detail-item"><label>Sample Type</label><p>{item.sample_type}</p></div>
                    <div className="detail-item"><label>Patient</label><p>{item.patient?.name}</p></div>
                    <div className="detail-item"><label>Bill No</label><p>{item.bill?.bill_no}</p></div>
                    <div className="detail-item"><label>Referred Doctor</label><p>{item.bill?.referred_doctor || '—'}</p></div>
                    <div className="detail-item"><label>Collected At</label><p>{item.collected_at ? new Date(item.collected_at).toLocaleString() : '—'}</p></div>
                    <div className="detail-item"><label>Collected By</label><p>{item.collected_by?.name || '—'}</p></div>
                    {item.rejection_reason && (
                        <div className="detail-item full-width"><label>Rejection Reason</label><p>{item.rejection_reason}</p></div>
                    )}
                </div>
            </Card>

            {item.status !== 'rejected' && item.status !== 'completed' && (
                <Card title="Update Status" className="mb-3">
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <Dropdown value={statusValue} options={nextStatusOptions} onChange={(e) => setStatusValue(e.value)} />
                        <Button label="Update Status" onClick={updateStatus} loading={loading} />
                    </div>
                </Card>
            )}

            <Card title="Linked Tests" className="mb-3">
                <DataTable value={item.sample_tests || []}>
                    <Column header="Test" body={(r) => r.test_name} />
                    <Column field="status" header="Status" body={(r) => <Tag value={r.status} />} />
                </DataTable>
            </Card>

            <Card title="Status History">
                <Timeline
                    value={item.status_history || []}
                    content={(h) => (
                        <div>
                            <Tag value={h.status} severity={statusSeverity[h.status]} />
                            <small style={{ display: 'block', marginTop: '0.25rem' }}>
                                {new Date(h.created_at).toLocaleString()}
                                {h.changed_by?.name ? ` · ${h.changed_by.name}` : ''}
                            </small>
                            {h.remarks && <p style={{ margin: '0.25rem 0 0' }}>{h.remarks}</p>}
                        </div>
                    )}
                />
            </Card>

            <Dialog header="Reject Sample" visible={rejectVisible} onHide={() => setRejectVisible(false)} style={{ width: '420px' }}>
                <div className="form-field">
                    <label>Rejection Reason <span className="required">*</span></label>
                    <InputTextarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={4} autoResize className="w-full" />
                </div>
                <div className="form-actions">
                    <Button label="Confirm Reject" severity="danger" onClick={handleReject} loading={loading} />
                    <Button label="Cancel" severity="secondary" outlined onClick={() => setRejectVisible(false)} />
                </div>
            </Dialog>
        </AppLayout>
    );
}
