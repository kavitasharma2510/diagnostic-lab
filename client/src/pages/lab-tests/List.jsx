import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { Badge } from 'primereact/badge';
import AppLayout from '../../components/AppLayout';
import StatusBadge from '../../components/StatusBadge';
import { labTestService, testCategoryService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

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

    return (
        <AppLayout>
            <div className="page-header">
                <div><h1 className="page-title">Test Master</h1><p className="text-muted">React frontend</p></div>
                <Button label="Add Test" icon="pi pi-plus" onClick={() => navigate('/lab-tests/create')} />
            </div>
            <Card>
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
                    <Column header="Params" body={(r) => <Badge value={r.parameters_count || 0} />} />
                    <Column header="Status" body={(r) => <StatusBadge status={r.status} />} />
                    <Column header="Actions" body={(r) => (
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                            <Button icon="pi pi-eye" text onClick={() => navigate(`/lab-tests/${r.id}`)} />
                            <Button icon="pi pi-pencil" text onClick={() => navigate(`/lab-tests/${r.id}/edit`)} />
                        </div>
                    )} />
                </DataTable>
            </Card>
        </AppLayout>
    );
}
