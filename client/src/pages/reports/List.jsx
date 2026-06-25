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
import { reportService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const statusOptions = [
    { label: 'All Statuses', value: null },
    { label: 'Draft', value: 'draft' },
    { label: 'Generated', value: 'generated' },
    { label: 'Approved', value: 'approved' },
];

const statusSeverity = { draft: 'warning', generated: 'info', approved: 'success' };

export default function ReportList() {
    const navigate = useNavigate();
    const toast = useToast();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [filters, setFilters] = useState({ search: '', status: null, page: 1, per_page: 10 });

    async function load() {
        setLoading(true);
        try {
            const { data } = await reportService.list({
                search: filters.search || undefined,
                status: filters.status || undefined,
                page: filters.page,
                per_page: filters.per_page,
            });
            setItems(data.data);
            setTotal(data.meta?.total || 0);
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to load reports');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); }, [filters.page, filters.per_page, filters.status]);

    async function shareWhatsApp(id) {
        try {
            const { data } = await reportService.whatsappLink(id);
            window.open(data.data.whatsapp_url, '_blank');
        } catch (e) {
            toast.error(e.response?.data?.message || 'WhatsApp link failed');
        }
    }

    return (
        <AppLayout>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Reports</h1>
                    <p className="text-muted">View, preview, and share pathology reports</p>
                </div>
                <Button label="Result Entry" icon="pi pi-pencil" onClick={() => navigate('/reports/entry')} />
            </div>
            <Card>
                <div className="filter-bar">
                    <InputText placeholder="Search report, patient, bill" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && load()} />
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
                    emptyMessage="No reports found."
                >
                    <Column field="report_no" header="Report No" />
                    <Column header="Patient" body={(r) => r.patient?.name} />
                    <Column header="Bill" body={(r) => r.bill?.bill_no} />
                    <Column header="Status" body={(r) => <Tag value={r.status} severity={statusSeverity[r.status]} />} />
                    <Column header="Prepared" body={(r) => r.prepared_at ? new Date(r.prepared_at).toLocaleString() : '—'} />
                    <Column header="Actions" body={(r) => (
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                            <Button icon="pi pi-pencil" text title="Edit Results" onClick={() => navigate(`/reports/entry/${r.id}`)} />
                            {r.status === 'approved' && (
                                <>
                                    <Button icon="pi pi-eye" text title="Preview" onClick={() => navigate(`/reports/${r.id}/preview`)} />
                                    <Button icon="pi pi-download" text title="Download" onClick={() => window.open(reportService.downloadUrl(r.id), '_blank')} />
                                    <Button icon="pi pi-whatsapp" text severity="success" title="WhatsApp" onClick={() => shareWhatsApp(r.id)} />
                                </>
                            )}
                        </div>
                    )} />
                </DataTable>
            </Card>
        </AppLayout>
    );
}
