import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { Badge } from 'primereact/badge';
import { confirmDialog } from 'primereact/confirmdialog';
import AppLayout from '../../components/AppLayout';
import PageHeader from '../../components/PageHeader';
import TableActions from '../../components/TableActions';
import StatusBadge from '../../components/StatusBadge';
import { labTestService, testCategoryService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { isWidalCode } from '../../utils/widal';

export default function LabTestList() {
    const navigate = useNavigate();
    const toast = useToast();
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [filters, setFilters] = useState({ search: '', test_category_id: null, status: null, page: 1, per_page: 10 });

    async function load() {
        setLoading(true);
        try {
            const { data } = await labTestService.list({
                search: filters.search || undefined,
                test_category_id: filters.test_category_id || undefined,
                status: filters.status || undefined,
                page: filters.page,
                per_page: filters.per_page,
            });
            setItems(data.data);
            setTotal(data.meta?.total || 0);
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to load tests');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        testCategoryService.list({ per_page: 100 }).then(({ data }) => setCategories([{ id: null, name: 'All' }, ...data.data]));
        load();
    }, [filters.page, filters.per_page, filters.status, filters.test_category_id]);

    function confirmDelete(row) {
        confirmDialog({
            message: `Delete test "${row.name}"? This cannot be undone.`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                try {
                    await labTestService.delete(row.id);
                    toast.success('Test deleted successfully');
                    load();
                } catch (e) {
                    toast.error(e.response?.data?.errors?.test?.[0] || e.response?.data?.message || 'Delete failed');
                }
            },
        });
    }

    return (
        <AppLayout>
            <PageHeader
                title="Lab Tests"
                subtitle="Add and manage grouped tests under each category"
                actionLabel="Add Test"
                onAction={() => navigate('/lab-tests/create')}
            />
            <div className="filter-bar">
                    <InputText placeholder="Search" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && load()} />
                    <Dropdown value={filters.test_category_id} options={categories} optionLabel="name" optionValue="id" onChange={(e) => setFilters({ ...filters, test_category_id: e.value, page: 1 })} />
                    <Button label="Search" onClick={load} />
                </div>
                <DataTable value={items} loading={loading} paginator rows={filters.per_page} totalRecords={total} lazy first={(filters.page - 1) * filters.per_page} onPage={(e) => setFilters({ ...filters, page: e.page + 1, per_page: e.rows })}>
                    <Column field="code" header="Code" />
                    <Column field="name" header="Name" />
                    <Column header="Category" body={(r) => r.category?.name} />
                    <Column field="sample_type" header="Sample" />
                    <Column header="Type" body={(r) => <Tag value={r.report_type} />} />
                    <Column header="Params" body={(r) => (
                        isWidalCode(r.code)
                            ? <Tag value="Widal Grid" severity="info" />
                            : <Badge value={r.parameters_count || 0} />
                    )} />
                    <Column header="Status" body={(r) => <StatusBadge status={r.status} />} />
                    <Column header="Actions" body={(r) => (
                        <TableActions
                            actions={[
                                { title: 'View', icon: 'pi pi-eye', onClick: () => navigate(`/lab-tests/${r.id}`) },
                                { title: 'Edit', icon: 'pi pi-pencil', onClick: () => navigate(`/lab-tests/${r.id}/edit`) },
                                { title: 'Delete', icon: 'pi pi-trash', onClick: () => confirmDelete(r) },
                            ]}
                        />
                    )} />
                </DataTable>
        </AppLayout>
    );
}
