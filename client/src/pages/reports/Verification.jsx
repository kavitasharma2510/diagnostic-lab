import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import axios from 'axios';
import { apiUrl } from '../../config/api';

export default function ReportVerification() {
    const { reportNo } = useParams();
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        axios.get(apiUrl(`/report/verify/${reportNo}`))
            .then((res) => setData(res.data.data))
            .catch((e) => setError(e.response?.data?.message || 'Report not found'));
    }, [reportNo]);

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '2rem' }}>
            <Card style={{ maxWidth: 520, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <i className="pi pi-shield" style={{ fontSize: '2.5rem', color: '#2563eb' }} />
                    <h1 style={{ margin: '0.5rem 0 0' }}>Report Verification</h1>
                </div>
                {error && <p style={{ color: '#dc2626' }}>{error}</p>}
                {data && (
                    <div className="detail-grid">
                        <div className="detail-item"><label>Report No</label><p>{data.report_no}</p></div>
                        <div className="detail-item"><label>Patient Name</label><p>{data.patient_name}</p></div>
                        <div className="detail-item"><label>Report Date</label><p>{new Date(data.report_date).toLocaleDateString()}</p></div>
                        <div className="detail-item"><label>Status</label><p><Tag value={data.status} /></p></div>
                        <div className="detail-item full-width">
                            <label>Authenticity</label>
                            <p>{data.authenticity_message}</p>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
