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
import { Checkbox } from 'primereact/checkbox';
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
    const [eligibleBills, setEligibleBills] = useState([]);
    const [selectedBill, setSelectedBill] = useState(null);
    const [report, setReport] = useState(null);
    const [results, setResults] = useState([]);
    const [selectedRows, setSelectedRows] = useState([]);
    const [remarks, setRemarks] = useState('');
    const [loading, setLoading] = useState(false);
    const [editFields, setEditFields] = useState({
        result_value: true,
        unit: true,
        reference_range: true,
    });
    const [bulkValues, setBulkValues] = useState({
        result_value: '',
        unit: '',
        reference_range: '',
    });

    const isApproved = report?.status === 'approved';

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
                    unit: rt.unit || '',
                    reference_range: rt.reference_range || '',
                    min_value: param?.min_value ?? rt.lab_test?.min_value,
                    max_value: param?.max_value ?? rt.lab_test?.max_value,
                };
            }));
            setSelectedRows([]);
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

    function toggleEditField(field, checked) {
        setEditFields((prev) => ({ ...prev, [field]: checked }));
    }

    function applyBulkUpdate() {
        if (!selectedRows.length) {
            toast.error('Select at least one test row');
            return;
        }

        const fieldsToApply = Object.entries(editFields).filter(([, enabled]) => enabled);
        if (!fieldsToApply.length) {
            toast.error('Enable at least one field to edit');
            return;
        }

        const hasBulkValue = fieldsToApply.some(([field]) => bulkValues[field]?.trim());
        if (!hasBulkValue) {
            toast.error('Enter a value for at least one enabled field');
            return;
        }

        const selectedIds = new Set(selectedRows.map((r) => r.id));
        setResults((prev) => prev.map((row) => {
            if (!selectedIds.has(row.id)) return row;
            const updated = { ...row };
            if (editFields.result_value && bulkValues.result_value.trim()) {
                updated.result_value = bulkValues.result_value;
            }
            if (editFields.unit && bulkValues.unit.trim()) {
                updated.unit = bulkValues.unit;
            }
            if (editFields.reference_range && bulkValues.reference_range.trim()) {
                updated.reference_range = bulkValues.reference_range;
            }
            return updated;
        }));

        toast.success(`Updated ${selectedRows.length} row(s)`);
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
                {!isApproved && (
                    <div className="bulk-edit-panel">
                        <h4>Bulk edit selected rows</h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <Checkbox checked={editFields.result_value} onChange={(e) => toggleEditField('result_value', e.checked)} />
                                <span>Edit Result</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <Checkbox checked={editFields.unit} onChange={(e) => toggleEditField('unit', e.checked)} />
                                <span>Edit Unit</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <Checkbox checked={editFields.reference_range} onChange={(e) => toggleEditField('reference_range', e.checked)} />
                                <span>Edit Reference Range</span>
                            </label>
                        </div>
                        <div className="form-grid" style={{ alignItems: 'end' }}>
                            <div className="form-field">
                                <label>Bulk Result</label>
                                <InputText
                                    value={bulkValues.result_value}
                                    onChange={(e) => setBulkValues({ ...bulkValues, result_value: e.target.value })}
                                    disabled={!editFields.result_value}
                                    placeholder="Value for selected rows"
                                />
                            </div>
                            <div className="form-field">
                                <label>Bulk Unit</label>
                                <InputText
                                    value={bulkValues.unit}
                                    onChange={(e) => setBulkValues({ ...bulkValues, unit: e.target.value })}
                                    disabled={!editFields.unit}
                                    placeholder="Unit for selected rows"
                                />
                            </div>
                            <div className="form-field">
                                <label>Bulk Reference Range</label>
                                <InputText
                                    value={bulkValues.reference_range}
                                    onChange={(e) => setBulkValues({ ...bulkValues, reference_range: e.target.value })}
                                    disabled={!editFields.reference_range}
                                    placeholder="Range for selected rows"
                                />
                            </div>
                            <div className="form-field">
                                <Button
                                    label={`Apply to Selected (${selectedRows.length})`}
                                    icon="pi pi-check-square"
                                    onClick={applyBulkUpdate}
                                    disabled={!selectedRows.length}
                                />
                            </div>
                        </div>
                    </div>
                )}

                <DataTable
                    value={results}
                    dataKey="id"
                    {...(!isApproved ? {
                        selection: selectedRows,
                        onSelectionChange: (e) => setSelectedRows(e.value),
                        selectionMode: 'checkbox',
                    } : {})}
                >
                    {!isApproved && (
                        <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
                    )}
                    <Column field="test_name" header="Test / Parameter" />
                    <Column
                        header="Result"
                        body={(r) => (
                            <InputText
                                value={r.result_value}
                                onChange={(e) => updateResult(r.id, 'result_value', e.target.value)}
                                disabled={isApproved || !editFields.result_value}
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
                                disabled={isApproved || !editFields.unit}
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
                                disabled={isApproved || !editFields.reference_range}
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
