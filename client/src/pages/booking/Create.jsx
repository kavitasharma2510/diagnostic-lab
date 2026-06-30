import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { SelectButton } from 'primereact/selectbutton';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { confirmDialog } from 'primereact/confirmdialog';
import AppLayout from '../../components/AppLayout';
import PageHeader from '../../components/PageHeader';
import TableActions from '../../components/TableActions';
import BookingTestPicker from '../../components/booking/BookingTestPicker';
import { registrationService, patientService, labTestService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const genderOptions = [
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' },
    { label: 'Other', value: 'Other' },
];

const patientModeOptions = [
    { label: 'New Patient', value: 'new' },
    { label: 'Existing Patient', value: 'existing' },
];

export default function PatientBookingCreate() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [patients, setPatients] = useState([]);
    const [allTests, setAllTests] = useState([]);
    const [selectedTests, setSelectedTests] = useState([]);
    const [patientMode, setPatientMode] = useState(
        searchParams.get('patient_id') ? 'existing' : 'new',
    );
    const [patient, setPatient] = useState({
        name: '',
        age: null,
        gender: null,
        mobile: '',
        referring_doctor: '',
    });
    const [existingPatientId, setExistingPatientId] = useState(
        searchParams.get('patient_id') || null,
    );
    const [patientSearch, setPatientSearch] = useState('');
    const [editDialogVisible, setEditDialogVisible] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [editErrors, setEditErrors] = useState({});
    const [editingPatientId, setEditingPatientId] = useState(null);
    const [editForm, setEditForm] = useState({
        name: '',
        age: null,
        gender: null,
        mobile: '',
        referring_doctor: '',
    });

    async function loadPatients() {
        const { data } = await patientService.list({ per_page: 300 });
        setPatients(data.data);
    }

    useEffect(() => {
        Promise.all([
            loadPatients(),
            labTestService.list({ per_page: 500, status: 'active' }),
        ]).then(([, testsRes]) => {
            setAllTests(testsRes.data.data);
        });
    }, []);

    const patientOptions = patients.map((p) => ({
        label: `${p.patient_no} — ${p.name}`,
        value: p.id,
    }));

    const filteredPatients = patients.filter((p) => {
        if (!patientSearch.trim()) return true;
        const q = patientSearch.trim().toLowerCase();
        return (
            p.name?.toLowerCase().includes(q)
            || p.patient_no?.toLowerCase().includes(q)
            || p.mobile?.includes(q)
        );
    });

    function openEditPatient(row) {
        setEditingPatientId(row.id);
        setEditForm({
            name: row.name || '',
            age: row.age ?? null,
            gender: row.gender || null,
            mobile: row.mobile || '',
            referring_doctor: row.referring_doctor || '',
        });
        setEditErrors({});
        setEditDialogVisible(true);
    }

    async function savePatientEdit() {
        if (!editingPatientId || !editForm.name?.trim()) {
            setEditErrors({ name: ['Patient name is required.'] });
            return;
        }

        setEditLoading(true);
        setEditErrors({});
        try {
            await patientService.update(editingPatientId, editForm);
            await loadPatients();
            toast.success('Patient updated');
            setEditDialogVisible(false);
        } catch (err) {
            setEditErrors(err.response?.data?.errors || {});
            toast.error(err.response?.data?.message || 'Update failed');
        } finally {
            setEditLoading(false);
        }
    }

    function confirmDeletePatient(row) {
        confirmDialog({
            message: `Delete patient "${row.name}" (${row.patient_no})? Their bills and reports will also be removed.`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                try {
                    await patientService.delete(row.id);
                    if (existingPatientId === row.id) {
                        setExistingPatientId(null);
                    }
                    await loadPatients();
                    toast.success('Patient deleted');
                } catch (e) {
                    toast.error(e.response?.data?.errors?.patient?.[0] || e.response?.data?.message || 'Delete failed');
                }
            },
        });
    }

    function fieldError(name) {
        return errors[name]?.[0];
    }

    async function submit(e) {
        e.preventDefault();
        setErrors({});

        if (!selectedTests.length) {
            toast.error('Select at least one test');
            return;
        }

        if (patientMode === 'new' && !patient.name?.trim()) {
            setErrors({ name: ['Patient name is required.'] });
            toast.error('Enter patient name');
            return;
        }

        if (patientMode === 'existing' && !existingPatientId) {
            toast.error('Select an existing patient');
            return;
        }

        setLoading(true);
        try {
            const referredDoctor = patient.referring_doctor
                || patients.find((p) => p.id === existingPatientId)?.referring_doctor
                || '';

            const payload = {
                lab_test_ids: selectedTests.map((t) => t.id),
                referred_doctor: referredDoctor || undefined,
            };

            if (patientMode === 'existing') {
                payload.patient_id = existingPatientId;
            } else {
                payload.patient = {
                    name: patient.name.trim(),
                    age: patient.age ?? undefined,
                    gender: patient.gender || undefined,
                    mobile: patient.mobile || undefined,
                    referring_doctor: referredDoctor || undefined,
                };
            }

            const { data } = await registrationService.register(payload);
            const reportId = data.data.report.id;

            toast.success('Registration complete — enter test results');
            navigate(`/reports/entry/${reportId}`);
        } catch (err) {
            setErrors(err.response?.data?.errors || {});
            toast.error(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    }

    return (
        <AppLayout>
            <PageHeader
                title="Patient Registration"
                subtitle="Register patient and select tests for the lab report"
            />

            <form onSubmit={submit}>
                <Card title="Patient" className="booking-form-compact content-card">
                    <SelectButton
                        value={patientMode}
                        options={patientModeOptions}
                        onChange={(e) => e.value && setPatientMode(e.value)}
                        style={{ marginBottom: '1rem' }}
                    />

                    {patientMode === 'new' ? (
                        <div className="form-grid">
                            <div className="form-field">
                                <label>Name <span className="required">*</span></label>
                                <InputText
                                    value={patient.name}
                                    onChange={(e) => setPatient({ ...patient, name: e.target.value })}
                                    className={fieldError('name') ? 'p-invalid' : ''}
                                    placeholder="Patient name"
                                />
                            </div>
                            <div className="form-field">
                                <label>Age</label>
                                <InputNumber
                                    value={patient.age}
                                    onValueChange={(e) => setPatient({ ...patient, age: e.value })}
                                    min={0}
                                    max={150}
                                />
                            </div>
                            <div className="form-field">
                                <label>Gender</label>
                                <Dropdown
                                    value={patient.gender}
                                    options={genderOptions}
                                    onChange={(e) => setPatient({ ...patient, gender: e.value })}
                                    placeholder="Select"
                                    showClear
                                />
                            </div>
                            <div className="form-field">
                                <label>Mobile</label>
                                <InputText
                                    value={patient.mobile}
                                    onChange={(e) => setPatient({ ...patient, mobile: e.target.value })}
                                    placeholder="Phone number"
                                />
                            </div>
                            <div className="form-field">
                                <label>Ref. Doctor</label>
                                <InputText
                                    value={patient.referring_doctor}
                                    onChange={(e) => setPatient({ ...patient, referring_doctor: e.target.value })}
                                    placeholder="Optional"
                                />
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="form-field">
                                <label>Patient <span className="required">*</span></label>
                                <Dropdown
                                    value={existingPatientId}
                                    options={patientOptions}
                                    onChange={(e) => setExistingPatientId(e.value)}
                                    placeholder="Search patient"
                                    filter
                                    className={fieldError('patient_id') ? 'p-invalid' : ''}
                                />
                            </div>

                            <div className="existing-patients-toolbar">
                                <InputText
                                    placeholder="Search by name, ID, or mobile"
                                    value={patientSearch}
                                    onChange={(e) => setPatientSearch(e.target.value)}
                                    className="existing-patients-search"
                                />
                            </div>

                            <DataTable
                                value={filteredPatients}
                                dataKey="id"
                                size="small"
                                paginator={filteredPatients.length > 8}
                                rows={8}
                                emptyMessage="No patients found."
                                selectionMode="single"
                                selection={filteredPatients.find((p) => p.id === existingPatientId) || null}
                                onSelectionChange={(e) => setExistingPatientId(e.value?.id || null)}
                                className="existing-patients-table"
                            >
                                <Column field="patient_no" header="Patient ID" />
                                <Column field="name" header="Name" />
                                <Column field="age" header="Age" body={(r) => r.age ?? '—'} />
                                <Column field="gender" header="Gender" body={(r) => r.gender || '—'} />
                                <Column field="mobile" header="Mobile" body={(r) => r.mobile || '—'} />
                                <Column
                                    header="Actions"
                                    body={(row) => (
                                        <TableActions
                                            actions={[
                                                {
                                                    title: 'Edit',
                                                    icon: 'pi pi-pencil',
                                                    onClick: () => openEditPatient(row),
                                                },
                                                {
                                                    title: 'Delete',
                                                    icon: 'pi pi-trash',
                                                    onClick: () => confirmDeletePatient(row),
                                                },
                                            ]}
                                        />
                                    )}
                                />
                            </DataTable>
                        </>
                    )}
                </Card>

                <Card title="Select Tests" className="content-card">
                    <BookingTestPicker
                        allTests={allTests}
                        selectedTests={selectedTests}
                        onChange={setSelectedTests}
                    />
                </Card>

                <div className="form-actions">
                    <Button
                        type="submit"
                        label="Continue to Report"
                        icon="pi pi-arrow-right"
                        loading={loading}
                        disabled={!selectedTests.length}
                    />
                </div>
            </form>

            <Dialog
                header="Edit Patient"
                visible={editDialogVisible}
                onHide={() => setEditDialogVisible(false)}
                style={{ width: '32rem' }}
                modal
            >
                <div className="form-grid">
                    <div className="form-field">
                        <label>Name <span className="required">*</span></label>
                        <InputText
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className={editErrors.name ? 'p-invalid' : ''}
                        />
                    </div>
                    <div className="form-field">
                        <label>Age</label>
                        <InputNumber
                            value={editForm.age}
                            onValueChange={(e) => setEditForm({ ...editForm, age: e.value })}
                            min={0}
                            max={150}
                        />
                    </div>
                    <div className="form-field">
                        <label>Gender</label>
                        <Dropdown
                            value={editForm.gender}
                            options={genderOptions}
                            onChange={(e) => setEditForm({ ...editForm, gender: e.value })}
                            placeholder="Select"
                            showClear
                        />
                    </div>
                    <div className="form-field">
                        <label>Mobile</label>
                        <InputText
                            value={editForm.mobile}
                            onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                        />
                    </div>
                    <div className="form-field">
                        <label>Ref. Doctor</label>
                        <InputText
                            value={editForm.referring_doctor}
                            onChange={(e) => setEditForm({ ...editForm, referring_doctor: e.target.value })}
                        />
                    </div>
                </div>
                <div className="form-actions" style={{ marginTop: '1rem' }}>
                    <Button label="Save" icon="pi pi-check" onClick={savePatientEdit} loading={editLoading} />
                    <Button label="Cancel" severity="secondary" outlined onClick={() => setEditDialogVisible(false)} />
                </div>
            </Dialog>
        </AppLayout>
    );
}
