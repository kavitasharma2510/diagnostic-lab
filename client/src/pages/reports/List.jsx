import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import AppLayout from '../../components/AppLayout';
import PageHeader from '../../components/PageHeader';
import TableActions from '../../components/TableActions';
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
            <PageHeader
                title="Reports"
                subtitle="Enter results, approve reports, and download PDFs"
            />
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
                        <TableActions
                            actions={[
                                ...(r.status === 'draft' ? [{
                                    title: 'Enter Results',
                                    icon: 'pi pi-pencil',
                                    onClick: () => navigate(`/reports/entry/${r.id}`),
                                }] : []),
                                ...(r.status === 'approved' ? [
                                    { title: 'Preview', icon: 'pi pi-eye', onClick: () => navigate(`/reports/${r.id}/preview`) },
                                    { title: 'Download', icon: 'pi pi-download', onClick: () => window.open(reportService.downloadUrl(r.id), '_blank') },
                                    { title: 'WhatsApp', icon: 'pi pi-whatsapp', onClick: () => shareWhatsApp(r.id) },
                                ] : []),
                            ]}
                        />
                    )} />
                </DataTable>
        </AppLayout>
    );
}
