import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Badge } from 'primereact/badge';
import AppLayout from '../../components/AppLayout';
import { billService } from '../../services/api';

function formatDate(value) {
    if (!value) return '—';
    return new Date(value).toLocaleString('en-IN');
}

export default function BillView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [item, setItem] = useState(null);

    useEffect(() => {
        billService.get(id).then(({ data }) => setItem(data.data)).catch(() => navigate('/bills'));
    }, [id, navigate]);

    if (!item) return <AppLayout><p>Loading...</p></AppLayout>;

    return (
        <AppLayout>
            <div className="page-header">
                <div>
                    <h1 className="page-title">{item.bill_no}</h1>
                    <p className="text-muted">{item.patient?.name} ({item.patient?.patient_no})</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button label="Pending Samples" icon="pi pi-clock" onClick={() => navigate('/samples/pending')} />
                    <Button label="Edit" icon="pi pi-pencil" onClick={() => navigate(`/bills/${id}/edit`)} />
                    <Button label="Back" severity="secondary" outlined onClick={() => navigate('/bills')} />
                </div>
            </div>
            <Card>
                <div className="detail-grid" style={{ marginBottom: '1.5rem' }}>
                    <div className="detail-item"><label>Bill Date</label><p>{formatDate(item.bill_date)}</p></div>
                    <div className="detail-item"><label>Total Amount</label><p>₹{Number(item.total_amount || 0).toFixed(2)}</p></div>
                    <div className="detail-item">
                        <label>Payment Status</label>
                        <p>
                            <Badge
                                value={item.payment_status}
                                severity={item.payment_status === 'Paid' ? 'success' : 'warning'}
                            />
                        </p>
                    </div>
                    <div className="detail-item"><label>Referring Doctor</label><p>{item.referred_doctor || '—'}</p></div>
                    <div className="detail-item full-width"><label>Remarks</label><p>{item.remarks || '—'}</p></div>
                </div>
                <h3>Bill Tests</h3>
                <DataTable value={item.bill_tests || []} size="small">
                    <Column field="test_name" header="Test" />
                    <Column header="From Profile" body={(r) => r.profile?.name || '—'} />
                    <Column header="Price" body={(r) => `₹${Number(r.price || 0).toFixed(2)}`} />
                    <Column
                        header="Status"
                        body={(r) => (
                            <Badge
                                value={r.status}
                                severity={r.status === 'Pending Sample' ? 'warning' : 'info'}
                            />
                        )}
                    />
                </DataTable>
            </Card>
        </AppLayout>
    );
}
