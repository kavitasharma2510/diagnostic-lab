import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import AppLayout from '../../components/AppLayout';
import PageHeader from '../../components/PageHeader';
import PageLoader from '../../components/PageLoader';
import { reportService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import WhatsAppShareDialog from '../../components/WhatsAppShareDialog';

export default function ReportPreview() {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [report, setReport] = useState(null);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [pdfError, setPdfError] = useState(null);
    const [pdfRetryKey, setPdfRetryKey] = useState(0);
    const [whatsappVisible, setWhatsappVisible] = useState(false);
    const [printLoading, setPrintLoading] = useState(false);
    const iframeRef = useRef(null);
    const printFrameRef = useRef(null);

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
        setWhatsappVisible(true);
    }

    async function printReport() {
        if (report?.status !== 'approved') return;

        setPrintLoading(true);
        try {
            const res = await fetch(reportService.printUrl(id));
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.message || 'Failed to load report for printing');
            }

            const html = await res.text();

            let frame = printFrameRef.current;
            if (!frame) {
                frame = document.createElement('iframe');
                frame.setAttribute('title', 'Print report');
                frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
                document.body.appendChild(frame);
                printFrameRef.current = frame;
            }

            const doc = frame.contentDocument || frame.contentWindow?.document;
            if (!doc) {
                throw new Error('Print failed — could not open print frame');
            }

            doc.open();
            doc.write(html);
            doc.close();
        } catch (e) {
            toast.error(e.message || 'Print failed');
        } finally {
            setPrintLoading(false);
        }
    }

    useEffect(() => () => {
        printFrameRef.current?.remove();
        printFrameRef.current = null;
    }, []);

    if (!report) return <AppLayout><PageLoader message="Loading report..." /></AppLayout>;

    return (
        <AppLayout>
            <PageHeader title="Report Preview" subtitle={report.report_no}>
                <Button label="Download PDF" icon="pi pi-download" onClick={() => window.open(reportService.downloadUrl(id), '_blank')} />
                <Button label="WhatsApp Share" icon="pi pi-whatsapp" severity="success" onClick={shareWhatsApp} />
                <Button label="Print" icon="pi pi-print" onClick={printReport} loading={printLoading} disabled={report.status !== 'approved' || printLoading} />
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
                        <iframe ref={iframeRef} title="Report PDF" src={pdfUrl} className="pdf-preview-frame" />
                    ) : null
                ) : (
                    <p className="text-muted">Approve the report to generate and preview the PDF.</p>
                )}
            </Card>
            <WhatsAppShareDialog
                visible={whatsappVisible}
                onHide={() => setWhatsappVisible(false)}
                reportId={id}
                defaultMobile={report.patient?.mobile}
                patientName={report.patient?.name}
            />
        </AppLayout>
    );
}
