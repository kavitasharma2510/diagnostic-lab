import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { confirmDialog } from 'primereact/confirmdialog';
import AppLayout from '../../components/AppLayout';
import { reportService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function ResultEntry() {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [eligibleBills, setEligibleBills] = useState([]);
    const [selectedBill, setSelectedBill] = useState(null);
    const [report, setReport] = useState(null);
    const [results, setResults] = useState([]);
    const [remarks, setRemarks] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        reportService.eligibleBills().then(({ data }) => setEligibleBills(data.data)).catch(() => {});
    }, []);

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
                    unit: rt.unit,
                    reference_range: rt.reference_range,
                    method: rt.method,
                    flag: rt.flag,
                    remarks: rt.remarks || '',
                    min_value: param?.min_value ?? rt.lab_test?.min_value,
                    max_value: param?.max_value ?? rt.lab_test?.max_value,
                };
            }));
            setRemarks(data.data.remarks || '');
        } catch {
            navigate('/reports/entry');
        }
    }

    async function generateReport() {
        if (!selectedBill) {
            toast.error('Select a bill first');
            return;
        }
        setLoading(true);
        try {
            const { data } = await reportService.generate(selectedBill);
            toast.success('Draft report created');
            navigate(`/reports/entry/${data.data.id}`);
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to generate report');
        } finally {
            setLoading(false);
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
                results: results.map((r) => ({
                    id: r.id,
                    result_value: r.result_value,
                    remarks: r.remarks,
                    min_value: r.min_value,
                    max_value: r.max_value,
                })),
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
                        results: results.map((r) => ({
                            id: r.id,
                            result_value: r.result_value,
                            remarks: r.remarks,
                            min_value: r.min_value,
                            max_value: r.max_value,
                        })),
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
                <div className="page-header">
                    <h1 className="page-title">Result Entry</h1>
                </div>
                <Card title="Select Bill for New Report">
                    <div className="form-field" style={{ maxWidth: 480, marginBottom: '1rem' }}>
                        <label>Eligible Bill</label>
                        <Dropdown
                            value={selectedBill}
                            options={eligibleBills}
                            optionLabel="bill_no"
                            optionValue="id"
                            onChange={(e) => setSelectedBill(e.value)}
                            placeholder="Select bill with collected samples"
                            className="w-full"
                            itemTemplate={(opt) => (
                                <div>{opt.bill_no} — {opt.patient?.name} ({opt.tests_count} tests)</div>
                            )}
                        />
                    </div>
                    <Button label="Generate Draft Report" icon="pi pi-file" onClick={generateReport} loading={loading} disabled={!selectedBill} />
                </Card>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Result Entry</h1>
                    <p className="text-muted">{report?.report_no} · {report?.patient?.name}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {report?.status !== 'approved' && (
                        <>
                            <Button label="Save Draft" icon="pi pi-save" outlined onClick={saveDraft} loading={loading} />
                            <Button label="Approve & Generate PDF" icon="pi pi-check" onClick={approveReport} loading={loading} />
                        </>
                    )}
                    <Button label="Back" severity="secondary" outlined onClick={() => navigate('/reports')} />
                </div>
            </div>

            <Card className="mb-3">
                <div className="detail-grid">
                    <div className="detail-item"><label>Bill No</label><p>{report?.bill?.bill_no}</p></div>
                    <div className="detail-item"><label>Status</label><p><Tag value={report?.status} /></p></div>
                    <div className="detail-item"><label>Referred Doctor</label><p>{report?.bill?.referred_doctor || '—'}</p></div>
                </div>
            </Card>

            <Card title="Test Results" className="mb-3">
                <DataTable value={results}>
                    <Column field="test_name" header="Test / Parameter" />
                    <Column header="Result" body={(r) => (
                        <InputText
                            value={r.result_value}
                            onChange={(e) => updateResult(r.id, 'result_value', e.target.value)}
                            disabled={report?.status === 'approved'}
                            className="w-full"
                        />
                    )} />
                    <Column field="unit" header="Unit" />
                    <Column field="reference_range" header="Reference Range" />
                    <Column field="method" header="Method" />
                    <Column header="Flag" body={(r) => r.flag ? <Tag value={r.flag} severity={r.flag === 'High' ? 'danger' : r.flag === 'Low' ? 'info' : 'success'} /> : '—'} />
                    <Column header="Remarks" body={(r) => (
                        <InputText
                            value={r.remarks}
                            onChange={(e) => updateResult(r.id, 'remarks', e.target.value)}
                            disabled={report?.status === 'approved'}
                            className="w-full"
                        />
                    )} />
                </DataTable>
            </Card>

            <Card title="Report Remarks">
                <InputTextarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3} autoResize className="w-full" disabled={report?.status === 'approved'} />
            </Card>
        </AppLayout>
    );
}
