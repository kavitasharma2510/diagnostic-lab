import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import AppLayout from '../../components/AppLayout';
import { sampleCollectionService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const statusOptions = [
    { label: 'All Statuses', value: null },
    { label: 'Collected', value: 'collected' },
    { label: 'Processing', value: 'processing' },
    { label: 'Completed', value: 'completed' },
    { label: 'Rejected', value: 'rejected' },
];

const statusSeverity = {
    pending: 'warning',
    collected: 'info',
    processing: 'primary',
    completed: 'success',
    rejected: 'danger',
};

export default function CollectedSamples() {
    const navigate = useNavigate();
    const toast = useToast();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [filters, setFilters] = useState({
        search: '', status: null, sample_type: '', bill_no: '', page: 1, per_page: 10,
    });

    async function load() {
        setLoading(true);
        try {
            const { data } = await sampleCollectionService.list({
                search: filters.search || undefined,
                status: filters.status || undefined,
                sample_type: filters.sample_type || undefined,
                bill_no: filters.bill_no || undefined,
                page: filters.page,
                per_page: filters.per_page,
            });
            setItems(data.data);
            setTotal(data.meta?.total || 0);
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to load samples');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); }, [filters.page, filters.per_page, filters.status]);

    return (
        <AppLayout>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Collected Samples</h1>
                    <p className="text-muted">View and manage collected samples</p>
                </div>
            </div>
            <Card>
                <div className="filter-bar">
                    <InputText placeholder="Search sample, patient, bill" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && load()} />
                    <InputText placeholder="Bill No" value={filters.bill_no} onChange={(e) => setFilters({ ...filters, bill_no: e.target.value })} />
                    <InputText placeholder="Sample type" value={filters.sample_type} onChange={(e) => setFilters({ ...filters, sample_type: e.target.value })} />
                    <Dropdown value={filters.status} options={statusOptions} onChange={(e) => setFilters({ ...filters, status: e.value, page: 1 })} placeholder="Status" />
                    <Button label="Search" icon="pi pi-search" onClick={load} />
                </div>
                <DataTable
                    value={items}
                    loading={loading}
                    paginator
                    lazy
                    rows={filters.per_page}
                    totalRecords={total}
                    first={(filters.page - 1) * filters.per_page}
                    onPage={(e) => setFilters({ ...filters, page: e.page + 1, per_page: e.rows })}
                >
                    <Column field="sample_no" header="Sample No" />
                    <Column field="barcode" header="Barcode" />
                    <Column field="sample_type" header="Type" />
                    <Column header="Patient" body={(r) => r.patient?.name} />
                    <Column header="Bill" body={(r) => r.bill?.bill_no} />
                    <Column header="Status" body={(r) => <Tag value={r.status} severity={statusSeverity[r.status] || 'secondary'} />} />
                    <Column header="Collected" body={(r) => r.collected_at ? new Date(r.collected_at).toLocaleString() : '—'} />
                    <Column header="Actions" body={(r) => (
                        <Button icon="pi pi-eye" text onClick={() => navigate(`/samples/${r.id}`)} />
                    )} />
                </DataTable>
            </Card>
        </AppLayout>
    );
}
