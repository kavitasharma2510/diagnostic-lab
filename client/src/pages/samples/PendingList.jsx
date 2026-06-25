import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import AppLayout from '../../components/AppLayout';
import { sampleCollectionService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function PendingSamples() {
    const navigate = useNavigate();
    const toast = useToast();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({ search: '', bill_no: '', sample_type: '' });

    async function load() {
        setLoading(true);
        try {
            const { data } = await sampleCollectionService.listPending({
                search: filters.search || undefined,
                bill_no: filters.bill_no || undefined,
                sample_type: filters.sample_type || undefined,
            });
            setItems(data.data);
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to load pending samples');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); }, []);

    function goCollect(row) {
        const params = new URLSearchParams({
            bill_id: row.bill_id,
            sample_type: row.sample_type,
            bill_test_ids: row.bill_test_ids.join(','),
        });
        navigate(`/samples/collect?${params.toString()}`);
    }

    return (
        <AppLayout>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Pending Samples</h1>
                    <p className="text-muted">Tests from billing awaiting sample collection</p>
                </div>
            </div>
            <Card>
                <div className="filter-bar">
                    <InputText placeholder="Search patient, bill, test" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && load()} />
                    <InputText placeholder="Bill No" value={filters.bill_no} onChange={(e) => setFilters({ ...filters, bill_no: e.target.value })} />
                    <InputText placeholder="Sample type" value={filters.sample_type} onChange={(e) => setFilters({ ...filters, sample_type: e.target.value })} />
                    <Button label="Search" icon="pi pi-search" onClick={load} />
                </div>
                <DataTable value={items} loading={loading} emptyMessage="No pending samples.">
                    <Column field="bill_no" header="Bill No" />
                    <Column header="Patient" body={(r) => r.patient?.name} />
                    <Column field="sample_type" header="Sample Type" />
                    <Column header="Tests" body={(r) => r.tests.map((t) => t.test_name).join(', ')} />
                    <Column header="Referred Doctor" body={(r) => r.referred_doctor || '—'} />
                    <Column header="Bill Date" body={(r) => new Date(r.bill_date).toLocaleDateString()} />
                    <Column header="Action" body={(r) => (
                        <Button label="Collect" icon="pi pi-check" size="small" onClick={() => goCollect(r)} />
                    )} />
                </DataTable>
            </Card>
        </AppLayout>
    );
}
