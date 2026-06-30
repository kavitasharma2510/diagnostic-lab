import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Tag } from 'primereact/tag';
import { confirmDialog } from 'primereact/confirmdialog';
import AppLayout from '../../components/AppLayout';
import PageHeader from '../../components/PageHeader';
import { reportService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

function buildResultPayload(results) {
    return results.map((r) => ({
        id: r.id,
        result_value: r.result_value,
        unit: r.unit,
        reference_range: r.reference_range,
        min_value: r.min_value,
        max_value: r.max_value,
    }));
}

export default function ResultEntry() {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [report, setReport] = useState(null);
    const [results, setResults] = useState([]);
    const [remarks, setRemarks] = useState('');
    const [loading, setLoading] = useState(false);

    const isApproved = report?.status === 'approved';

    useEffect(() => {
        if (!id) return;
        loadReport(id);
    }, [id]);

    async function loadReport(reportId) {
        try {
            const { data } = await reportService.get(reportId);
            setReport(data.data);
            setResults(data.data.report_tests.map((rt) => {
                const param = rt.lab_test?.parameters?.find((p) => p.name === rt.test_name);
                return {
                    id: rt.id,
                    test_name: rt.test_name,
                    result_value: rt.result_value || '',
                    unit: rt.unit || '',
                    reference_range: rt.reference_range || '',
                    min_value: param?.min_value ?? rt.lab_test?.min_value,
                    max_value: param?.max_value ?? rt.lab_test?.max_value,
                };
            }));
            setRemarks(data.data.remarks || '');
        } catch {
            navigate('/reports/entry');
        }
    }

    function updateResult(rowId, field, value) {
        setResults((prev) => prev.map((r) => (r.id === rowId ? { ...r, [field]: value } : r)));
    }

    async function saveDraft() {
        if (!report) return;
        setLoading(true);
        try {
            await reportService.saveResults(report.id, {
                remarks,
                results: buildResultPayload(results),
            });
            toast.success('Draft saved');
            loadReport(report.id);
        } catch (e) {
            toast.error(e.response?.data?.message || 'Save failed');
        } finally {
            setLoading(false);
        }
    }

    function approveReport() {
        confirmDialog({
            message: 'Approve report and generate PDF?',
            header: 'Confirm Approval',
            icon: 'pi pi-check-circle',
            accept: async () => {
                setLoading(true);
                try {
                    await reportService.saveResults(report.id, {
                        remarks,
                        results: buildResultPayload(results),
                    });
                    await reportService.approve(report.id);
                    toast.success('Report approved and PDF generated');
                    navigate(`/reports/${report.id}/preview`);
                } catch (e) {
                    toast.error(e.response?.data?.message || 'Approval failed');
                } finally {
                    setLoading(false);
                }
            },
        });
    }

    if (!id) {
        return (
            <AppLayout>
                <PageHeader
                    title="Enter Results"
                    subtitle="Complete a patient registration or open a draft report"
                />
                <div className="empty-state">
                    <i className="pi pi-file-edit" />
                    <p>Register a patient with tests in Registration, or open an existing draft from Reports.</p>
                    <div className="page-header-actions">
                        <Button label="Patient Registration" icon="pi pi-user-plus" onClick={() => navigate('/booking')} />
                        <Button label="View Reports" icon="pi pi-list" severity="secondary" outlined onClick={() => navigate('/reports')} />
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <PageHeader
                title="Enter Results"
                subtitle={`${report?.report_no || ''} · ${report?.patient?.name || ''}`}
            >
                {!isApproved && (
                    <>
                        <Button label="Save Draft" icon="pi pi-save" outlined onClick={saveDraft} loading={loading} />
                        <Button label="Approve & Generate PDF" icon="pi pi-check" onClick={approveReport} loading={loading} />
                    </>
                )}
                <Button label="Back" severity="secondary" outlined onClick={() => navigate('/reports')} />
            </PageHeader>

            <Card className="content-card mb-3">
                <div className="detail-grid">
                    <div className="detail-item"><label>Bill No</label><p>{report?.bill?.bill_no}</p></div>
                    <div className="detail-item"><label>Status</label><p><Tag value={report?.status} /></p></div>
                    <div className="detail-item"><label>Referred Doctor</label><p>{report?.bill?.referred_doctor || '—'}</p></div>
                </div>
            </Card>

            <Card title="Test Results" className="content-card mb-3">
                <DataTable value={results} dataKey="id">
                    <Column field="test_name" header="Test / Parameter" />
                    <Column
                        header="Result"
                        body={(r) => (
                            <InputText
                                value={r.result_value}
                                onChange={(e) => updateResult(r.id, 'result_value', e.target.value)}
                                disabled={isApproved}
                                className="w-full"
                            />
                        )}
                    />
                    <Column
                        header="Unit"
                        body={(r) => (
                            <InputText
                                value={r.unit}
                                onChange={(e) => updateResult(r.id, 'unit', e.target.value)}
                                disabled={isApproved}
                                className="w-full"
                            />
                        )}
                    />
                    <Column
                        header="Reference Range"
                        body={(r) => (
                            <InputText
                                value={r.reference_range}
                                onChange={(e) => updateResult(r.id, 'reference_range', e.target.value)}
                                disabled={isApproved}
                                className="w-full"
                            />
                        )}
                    />
                </DataTable>
            </Card>

            <Card title="Report Remarks">
                <InputTextarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3} autoResize className="w-full" disabled={isApproved} />
            </Card>
        </AppLayout>
    );
}
