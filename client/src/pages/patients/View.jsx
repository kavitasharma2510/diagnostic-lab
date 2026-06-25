import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import AppLayout from '../../components/AppLayout';
import { patientService } from '../../services/api';

export default function PatientView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [item, setItem] = useState(null);

    useEffect(() => {
        patientService.get(id).then(({ data }) => setItem(data.data)).catch(() => navigate('/patients'));
    }, [id, navigate]);

    if (!item) return <AppLayout><p>Loading...</p></AppLayout>;

    return (
        <AppLayout>
            <div className="page-header">
                <div>
                    <h1 className="page-title">{item.name}</h1>
                    <p className="text-muted">{item.patient_no}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button label="Create Bill" icon="pi pi-file" onClick={() => navigate(`/bills/create?patient_id=${id}`)} />
                    <Button label="Edit" icon="pi pi-pencil" onClick={() => navigate(`/patients/${id}/edit`)} />
                    <Button label="Back" severity="secondary" outlined onClick={() => navigate('/patients')} />
                </div>
            </div>
            <Card>
                <div className="detail-grid">
                    <div className="detail-item"><label>Patient ID</label><p>{item.patient_no}</p></div>
                    <div className="detail-item"><label>Age</label><p>{item.age ?? '—'}</p></div>
                    <div className="detail-item"><label>Gender</label><p>{item.gender || '—'}</p></div>
                    <div className="detail-item"><label>Mobile</label><p>{item.mobile || '—'}</p></div>
                    <div className="detail-item"><label>Referring Doctor</label><p>{item.referring_doctor || '—'}</p></div>
                    <div className="detail-item"><label>Bills</label><p>{item.bills_count ?? 0}</p></div>
                    <div className="detail-item full-width"><label>Address</label><p>{item.address || '—'}</p></div>
                </div>
            </Card>
        </AppLayout>
    );
}
