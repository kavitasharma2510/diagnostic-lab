import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { InputSwitch } from 'primereact/inputswitch';
import { Badge } from 'primereact/badge';
import { confirmDialog } from 'primereact/confirmdialog';
import AppLayout from '../../components/AppLayout';
import PageHeader from '../../components/PageHeader';
import TableActions from '../../components/TableActions';
import StatusBadge from '../../components/StatusBadge';
import { testCategoryService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const statusOptions = [
    { label: 'All Statuses', value: null },
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
];

export default function TestCategoryList() {
    const navigate = useNavigate();
    const toast = useToast();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [filters, setFilters] = useState({ search: '', status: null, page: 1, per_page: 10 });

    async function load() {
        setLoading(true);
        try {
            const { data } = await testCategoryService.list({
                search: filters.search || undefined,
                status: filters.status || undefined,
                page: filters.page,
                per_page: filters.per_page,
            });
            setItems(data.data);
            setTotal(data.meta?.total || 0);
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to load categories');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); }, [filters.page, filters.per_page, filters.status]);

    async function toggleStatus(row) {
        const newStatus = row.status === 'active' ? 'inactive' : 'active';
        try {
            await testCategoryService.update(row.id, { status: newStatus });
            toast.success(`Category marked as ${newStatus}`);
            load();
        } catch (e) {
            toast.error(e.response?.data?.message || 'Update failed');
        }
    }

    function confirmDelete(row) {
        confirmDialog({
            message: `Delete "${row.name}"?`,
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                try {
                    await testCategoryService.delete(row.id);
                    toast.success('Deleted successfully');
                    load();
                } catch (e) {
                    toast.error(e.response?.data?.errors?.category?.[0] || e.response?.data?.message || 'Delete failed');
                }
            },
        });
    }

    return (
        <AppLayout>
            <PageHeader
                title="Test Categories"
                subtitle="Create and manage test categories (CBC, LFT, KFT, etc.)"
                actionLabel="Add Category"
                onAction={() => navigate('/test-categories/create')}
            />
            <div className="filter-bar">
                    <InputText
                        placeholder="Search name or code"
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && load()}
                    />
                    <Dropdown
                        value={filters.status}
                        options={statusOptions}
                        optionLabel="label"
                        optionValue="value"
                        onChange={(e) => setFilters({ ...filters, status: e.value, page: 1 })}
                        placeholder="Status"
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
                    <Column field="code" header="Code" />
                    <Column field="name" header="Name" />
                    <Column header="Tests" body={(row) => <Badge value={row.tests_count || 0} severity="info" />} />
                    <Column
                        header="Status"
                        body={(row) => (
                            <div className="status-cell">
                                <StatusBadge status={row.status} />
                                <InputSwitch checked={row.status === 'active'} onChange={() => toggleStatus(row)} />
                            </div>
                        )}
                    />
                    <Column
                        header="Actions"
                        body={(row) => (
                            <TableActions
                                actions={[
                                    { title: 'View', icon: 'pi pi-eye', onClick: () => navigate(`/test-categories/${row.id}`) },
                                    { title: 'Edit', icon: 'pi pi-pencil', onClick: () => navigate(`/test-categories/${row.id}/edit`) },
                                    { title: 'Delete', icon: 'pi pi-trash', onClick: () => confirmDelete(row) },
                                ]}
                            />
                        )}
                    />
                </DataTable>
        </AppLayout>
    );
}
