import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { SelectButton } from 'primereact/selectbutton';
import AppLayout from '../../components/AppLayout';
import PageHeader from '../../components/PageHeader';
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

    useEffect(() => {
        Promise.all([
            patientService.list({ per_page: 300 }),
            labTestService.list({ per_page: 500, status: 'active' }),
        ]).then(([patientsRes, testsRes]) => {
            setPatients(patientsRes.data.data);
            setAllTests(testsRes.data.data);
        });
    }, []);

    const patientOptions = patients.map((p) => ({
        label: `${p.patient_no} — ${p.name}`,
        value: p.id,
    }));

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
        </AppLayout>
    );
}
