import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Badge } from 'primereact/badge';
import { confirmDialog } from 'primereact/confirmdialog';
import AppLayout from '../../components/AppLayout';
import { billService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const paymentOptions = [
    { label: 'All', value: null },
    { label: 'Paid', value: 'Paid' },
    { label: 'Unpaid', value: 'Unpaid' },
];

function formatDate(value) {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('en-IN');
}

export default function BillList() {
    const navigate = useNavigate();
    const toast = useToast();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [filters, setFilters] = useState({ search: '', payment_status: null, page: 1, per_page: 10 });

    async function load() {
        setLoading(true);
        try {
            const { data } = await billService.list({
                search: filters.search || undefined,
                payment_status: filters.payment_status || undefined,
                page: filters.page,
                per_page: filters.per_page,
            });
            setItems(data.data);
            setTotal(data.meta?.total || 0);
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to load bills');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); }, [filters.page, filters.per_page, filters.payment_status]);

    function confirmDelete(row) {
        confirmDialog({
            message: `Delete bill ${row.bill_no}?`,
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                try {
                    await billService.delete(row.id);
                    toast.success('Bill deleted');
                    load();
                } catch (e) {
                    toast.error(e.response?.data?.message || 'Delete failed');
                }
            },
        });
    }

    return (
        <AppLayout>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Bills</h1>
                    <p className="text-muted">Minimal billing for lab workflow</p>
                </div>
                <Button label="Create Bill" icon="pi pi-plus" onClick={() => navigate('/bills/create')} />
            </div>
            <Card>
                <div className="filter-bar">
                    <InputText
                        placeholder="Search bill no or patient"
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && load()}
                    />
                    <Dropdown
                        value={filters.payment_status}
                        options={paymentOptions}
                        optionLabel="label"
                        optionValue="value"
                        onChange={(e) => setFilters({ ...filters, payment_status: e.value, page: 1 })}
                        placeholder="Payment"
                    />
                    <Button label="Search" icon="pi pi-search" onClick={load} />
                </div>
                <DataTable
                    value={items}
                    loading={loading}
                    paginator
                    rows={filters.per_page}
                    totalRecords={total}
                    lazy
                    first={(filters.page - 1) * filters.per_page}
                    onPage={(e) => setFilters({ ...filters, page: e.page + 1, per_page: e.rows })}
                >
                    <Column field="bill_no" header="Bill No" />
                    <Column header="Patient" body={(r) => r.patient?.name || '—'} />
                    <Column header="Tests" body={(r) => <Badge value={r.tests_count || 0} />} />
                    <Column header="Total" body={(r) => `₹${Number(r.total_amount || 0).toFixed(2)}`} />
                    <Column
                        header="Payment"
                        body={(r) => (
                            <Badge
                                value={r.payment_status}
                                severity={r.payment_status === 'Paid' ? 'success' : 'warning'}
                            />
                        )}
                    />
                    <Column header="Bill Date" body={(r) => formatDate(r.bill_date)} />
                    <Column
                        header="Actions"
                        body={(row) => (
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                <Button icon="pi pi-eye" text onClick={() => navigate(`/bills/${row.id}`)} />
                                <Button icon="pi pi-pencil" text severity="warning" onClick={() => navigate(`/bills/${row.id}/edit`)} />
                                <Button icon="pi pi-trash" text severity="danger" onClick={() => confirmDelete(row)} />
                            </div>
                        )}
                    />
                </DataTable>
            </Card>
        </AppLayout>
    );
}
