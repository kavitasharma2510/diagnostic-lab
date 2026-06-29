import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { confirmDialog } from 'primereact/confirmdialog';
import AppLayout from '../../components/AppLayout';
import { patientService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const genderOptions = [
    { label: 'All Genders', value: null },
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' },
    { label: 'Other', value: 'Other' },
];

export default function PatientList() {
    const navigate = useNavigate();
    const toast = useToast();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [filters, setFilters] = useState({ search: '', gender: null, page: 1, per_page: 10 });

    async function load() {
        setLoading(true);
        try {
            const { data } = await patientService.list({
                search: filters.search || undefined,
                gender: filters.gender || undefined,
                page: filters.page,
                per_page: filters.per_page,
            });
            setItems(data.data);
            setTotal(data.meta?.total || 0);
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to load patients');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); }, [filters.page, filters.per_page, filters.gender]);

    function confirmDelete(row) {
        confirmDialog({
            message: `Delete patient "${row.name}"?`,
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                try {
                    await patientService.delete(row.id);
                    toast.success('Patient deleted');
                    load();
                } catch (e) {
                    toast.error(e.response?.data?.errors?.patient?.[0] || e.response?.data?.message || 'Delete failed');
                }
            },
        });
    }

    return (
        <AppLayout>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Patients</h1>
                    <p className="text-muted">Patient registration</p>
                </div>
                <Button label="Register Patient" icon="pi pi-plus" onClick={() => navigate('/booking')} />
            </div>
            <Card>
                <div className="filter-bar">
                    <InputText
                        placeholder="Search name, ID, or mobile"
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && load()}
                    />
                    <Dropdown
                        value={filters.gender}
                        options={genderOptions}
                        optionLabel="label"
                        optionValue="value"
                        onChange={(e) => setFilters({ ...filters, gender: e.value, page: 1 })}
                        placeholder="Gender"
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
                    <Column field="patient_no" header="Patient ID" />
                    <Column field="name" header="Name" />
                    <Column field="age" header="Age" body={(r) => r.age ?? '—'} />
                    <Column field="gender" header="Gender" body={(r) => r.gender || '—'} />
                    <Column field="mobile" header="Mobile" body={(r) => r.mobile || '—'} />
                    <Column field="referring_doctor" header="Referring Doctor" body={(r) => r.referring_doctor || '—'} />
                    <Column
                        header="Actions"
                        body={(row) => (
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                <Button icon="pi pi-eye" text onClick={() => navigate(`/patients/${row.id}`)} />
                                <Button icon="pi pi-pencil" text severity="warning" onClick={() => navigate(`/patients/${row.id}/edit`)} />
                                <Button icon="pi pi-trash" text severity="danger" onClick={() => confirmDelete(row)} />
                            </div>
                        )}
                    />
                </DataTable>
            </Card>
        </AppLayout>
    );
}
