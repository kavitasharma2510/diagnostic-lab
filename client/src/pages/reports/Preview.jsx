import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import AppLayout from '../../components/AppLayout';
import { reportService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function ReportPreview() {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [report, setReport] = useState(null);

    useEffect(() => {
        reportService.get(id).then(({ data }) => setReport(data.data)).catch(() => navigate('/reports'));
    }, [id]);

    async function shareWhatsApp() {
        try {
            const { data } = await reportService.whatsappLink(id);
            window.open(data.data.whatsapp_url, '_blank');
        } catch (e) {
            toast.error(e.response?.data?.message || 'WhatsApp link failed');
        }
    }

    if (!report) return <AppLayout><p>Loading...</p></AppLayout>;

    return (
        <AppLayout>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Report Preview</h1>
                    <p className="text-muted">{report.report_no}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <Button label="Download PDF" icon="pi pi-download" onClick={() => window.open(reportService.downloadUrl(id), '_blank')} />
                    <Button label="WhatsApp Share" icon="pi pi-whatsapp" severity="success" onClick={shareWhatsApp} />
                    <Button label="Edit Results" icon="pi pi-pencil" outlined onClick={() => navigate(`/reports/entry/${id}`)} />
                    <Button label="Back" severity="secondary" outlined onClick={() => navigate('/reports')} />
                </div>
            </div>
            <Card>
                {report.status === 'approved' ? (
                    <iframe
                        title="Report PDF"
                        src={reportService.previewUrl(id)}
                        style={{ width: '100%', height: '80vh', border: '1px solid #e2e8f0' }}
                    />
                ) : (
                    <p className="text-muted">Approve the report to generate and preview the PDF.</p>
                )}
            </Card>
        </AppLayout>
    );
}
