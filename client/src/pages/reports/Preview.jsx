import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import AppLayout from '../../components/AppLayout';
import PageHeader from '../../components/PageHeader';
import PageLoader from '../../components/PageLoader';
import { reportService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function ReportPreview() {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [report, setReport] = useState(null);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [pdfError, setPdfError] = useState(null);
    const [pdfRetryKey, setPdfRetryKey] = useState(0);

    useEffect(() => {
        reportService.get(id).then(({ data }) => setReport(data.data)).catch(() => navigate('/reports'));
    }, [id, navigate]);

    useEffect(() => {
        if (!report || report.status !== 'approved') return undefined;

        let objectUrl;
        setPdfLoading(true);
        setPdfError(null);

        fetch(reportService.previewUrl(id))
            .then(async (res) => {
                if (!res.ok) {
                    const body = await res.json().catch(() => ({}));
                    throw new Error(body.message || 'Failed to load PDF');
                }
                const blob = await res.blob();
                objectUrl = URL.createObjectURL(blob);
                setPdfUrl(objectUrl);
            })
            .catch((e) => setPdfError(e.message || 'Failed to load PDF'))
            .finally(() => setPdfLoading(false));

        return () => {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [id, report, pdfRetryKey]);

    async function shareWhatsApp() {
        try {
            const { data } = await reportService.whatsappLink(id);
            window.open(data.data.whatsapp_url, '_blank');
        } catch (e) {
            toast.error(e.response?.data?.message || 'WhatsApp link failed');
        }
    }

    if (!report) return <AppLayout><PageLoader message="Loading report..." /></AppLayout>;

    return (
        <AppLayout>
            <PageHeader title="Report Preview" subtitle={report.report_no}>
                <Button label="Download PDF" icon="pi pi-download" onClick={() => window.open(reportService.downloadUrl(id), '_blank')} />
                <Button label="WhatsApp Share" icon="pi pi-whatsapp" severity="success" onClick={shareWhatsApp} />
                <Button label="Edit Results" icon="pi pi-pencil" outlined onClick={() => navigate(`/reports/entry/${id}`)} />
                <Button label="Back" severity="secondary" outlined onClick={() => navigate('/reports')} />
            </PageHeader>
            <Card className="content-card">
                {report.status === 'approved' ? (
                    pdfLoading ? (
                        <div className="pdf-preview-loading">
                            <ProgressSpinner />
                            <p className="text-muted">Generating report PDF…</p>
                        </div>
                    ) : pdfError ? (
                        <div className="pdf-preview-error">
                            <p>{pdfError}</p>
                            <Button label="Retry" icon="pi pi-refresh" onClick={() => setPdfRetryKey((k) => k + 1)} />
                        </div>
                    ) : pdfUrl ? (
                        <iframe title="Report PDF" src={pdfUrl} className="pdf-preview-frame" />
                    ) : null
                ) : (
                    <p className="text-muted">Approve the report to generate and preview the PDF.</p>
                )}
            </Card>
        </AppLayout>
    );
}
