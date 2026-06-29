import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { buildPagination, paginatedResponse, paginatedList } from '../utils/pagination.js';
import { serialize } from '../utils/serialize.js';
import { parseId } from '../utils/parseId.js';
import { detectFlag } from '../utils/flagDetector.js';
import { generateReportPdf, labConfig, REPORTS_DIR } from '../templates/reportPdfTemplate.js';
import { sortRowsByPanelSequence, resolvePanelKey } from '../constants/panelSequences.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function mapReport(report) {
    return serialize({
        ...report,
        report_no: report.reportNo,
        qr_code: report.qrCode,
        pdf_path: report.pdfPath,
        prepared_at: report.preparedAt,
        approved_at: report.approvedAt,
        prepared_by: report.preparedBy,
        approved_by: report.approvedBy,
        bill_id: report.billId,
        patient_id: report.patientId,
        patient: report.patient
            ? { ...serialize(report.patient), patient_no: report.patient.patientNo }
            : undefined,
        bill: report.bill
            ? {
                ...serialize(report.bill),
                bill_no: report.bill.billNo,
                referred_doctor: report.bill.referredDoctor,
            }
            : undefined,
        report_tests: report.reportTests?.map((rt) => ({
            ...serialize(rt),
            lab_test_id: rt.labTestId,
            profile_id: rt.profileId,
            test_name: rt.testName,
            result_value: rt.resultValue,
            reference_range: rt.referenceRange,
            sort_order: rt.sortOrder,
            lab_test: rt.labTest
                ? {
                    ...serialize(rt.labTest),
                    report_type: rt.labTest.reportType,
                    sample_type: rt.labTest.sampleType,
                    min_value: rt.labTest.minValue,
                    max_value: rt.labTest.maxValue,
                    category: rt.labTest.category,
                    parameters: rt.labTest.parameters?.map((p) => serialize({
                        ...p,
                        min_value: p.minValue,
                        max_value: p.maxValue,
                    })),
                }
                : undefined,
        })),
    });
}

async function generateReportNo(db = prisma) {
    const today = new Date();
    const prefix = `RPT-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;

    const last = await db.labReport.findFirst({
        where: { reportNo: { startsWith: prefix } },
        orderBy: { reportNo: 'desc' },
    });

    const sequence = last ? Number(last.reportNo.split('-').pop()) + 1 : 1;
    return `${prefix}-${String(sequence).padStart(4, '0')}`;
}

function normalizeReportTestOrder(reportTests) {
    const ordered = [...reportTests].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    const byLabTest = {};

    for (const rt of ordered) {
        const id = rt.labTestId || rt.id;
        if (!byLabTest[id]) byLabTest[id] = [];
        byLabTest[id].push(rt);
    }

    const seen = new Set();
    const result = [];

    for (const rt of ordered) {
        const id = rt.labTestId || rt.id;
        if (seen.has(id)) continue;
        seen.add(id);

        const rows = byLabTest[id];
        const panelKey = resolvePanelKey(rt.labTest?.code)
            || resolvePanelKey(rt.labTest?.category?.code);
        result.push(...(panelKey ? sortRowsByPanelSequence(rows, panelKey) : rows));
    }

    return result;
}

function orderGroupedParameters(labTest) {
    const params = [...labTest.parameters].sort(
        (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
    );
    const panelKey = resolvePanelKey(labTest.code) || resolvePanelKey(labTest.category?.code);
    if (!panelKey) return params;

    const byName = Object.fromEntries(params.map((p) => [p.name, p]));
    return sortRowsByPanelSequence(
        params.map((p) => ({ testName: p.name, sortOrder: p.sortOrder })),
        panelKey,
    )
        .map((row) => byName[row.testName])
        .filter(Boolean);
}

function buildTestRows(billTests) {
    const rows = [];
    let sortOrder = 0;

    const orderedBillTests = [...billTests].sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    );

    for (const bt of orderedBillTests) {
        const labTest = bt.labTest;
        if (!labTest) continue;

        if (labTest.reportType === 'grouped' && labTest.parameters?.length) {
            const orderedParams = orderGroupedParameters(labTest);
            for (const param of orderedParams) {
                rows.push({
                    labTestId: labTest.id,
                    profileId: bt.profileId,
                    testName: param.name,
                    unit: param.unit || labTest.unit,
                    referenceRange: param.referenceRange || labTest.referenceRange,
                    method: param.method || labTest.method,
                    minValue: param.minValue,
                    maxValue: param.maxValue,
                    sortOrder: sortOrder++,
                });
            }
        } else {
            rows.push({
                labTestId: labTest.id,
                profileId: bt.profileId,
                testName: bt.testName || labTest.name,
                unit: labTest.unit,
                referenceRange: labTest.referenceRange,
                method: labTest.method,
                minValue: labTest.minValue,
                maxValue: labTest.maxValue,
                sortOrder: sortOrder++,
            });
        }
    }

    return rows;
}

const reportInclude = {
    patient: true,
    bill: true,
    preparedBy: { select: { id: true, name: true } },
    approvedBy: { select: { id: true, name: true } },
    reportTests: {
        orderBy: { sortOrder: 'asc' },
        include: {
            labTest: { include: { category: true, parameters: { where: { status: 'active' }, orderBy: { sortOrder: 'asc' } } } },
            profile: true,
        },
    },
};

export const reportGenerationService = {
    async list(filters = {}) {
        const { currentPage, limit, skip } = buildPagination(filters.page, filters.per_page);
        const where = {};

        if (filters.status) where.status = filters.status;
        if (filters.patient_id) where.patientId = parseId(filters.patient_id);
        if (filters.bill_no) {
            where.bill = { billNo: { contains: filters.bill_no } };
        }

        if (filters.search) {
            where.OR = [
                { reportNo: { contains: filters.search } },
                { patient: { name: { contains: filters.search } } },
                { bill: { billNo: { contains: filters.search } } },
            ];
        }

        const [total, rows] = await paginatedList(
            prisma.labReport.count({ where }),
            prisma.labReport.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    patient: true,
                    bill: true,
                    preparedBy: { select: { id: true, name: true } },
                    approvedBy: { select: { id: true, name: true } },
                    _count: { select: { reportTests: true } },
                },
            }),
        );

        const data = rows.map((r) => mapReport(r));
        return paginatedResponse(data, total, currentPage, limit);
    },

    async getEligibleBills() {
        const bills = await prisma.bill.findMany({
            where: {
                billTests: { some: { status: { in: ['collected', 'completed'] } } },
            },
            include: {
                patient: true,
                billTests: {
                    include: { labTest: { include: { parameters: { where: { status: 'active' }, orderBy: { sortOrder: 'asc' } } } } },
                },
                reports: { where: { status: { in: ['draft', 'generated', 'approved'] } } },
                samples: { where: { status: { in: ['collected', 'processing', 'completed'] } } },
            },
            orderBy: { billDate: 'desc' },
        });

        return bills
            .filter((bill) => {
                const collectedTests = bill.billTests.filter((bt) => ['collected', 'completed'].includes(bt.status));
                const hasActiveReport = bill.reports.some((r) => r.status !== 'rejected');
                return collectedTests.length > 0 && !hasActiveReport;
            })
            .map((bill) => serialize({
                id: bill.id,
                bill_no: bill.billNo,
                bill_date: bill.billDate,
                referred_doctor: bill.referredDoctor,
                patient: { id: bill.patient.id, name: bill.patient.name, patient_no: bill.patient.patientNo },
                tests_count: bill.billTests.filter((bt) => ['collected', 'completed'].includes(bt.status)).length,
            }));
    },

    async generate(billId, preparedById = null) {
        const bill = await prisma.bill.findUnique({
            where: { id: parseId(billId) },
            include: {
                patient: true,
                billTests: {
                    where: { status: { in: ['collected', 'completed'] } },
                    orderBy: { createdAt: 'asc' },
                    include: {
                        labTest: {
                            include: {
                                parameters: { where: { status: 'active' }, orderBy: { sortOrder: 'asc' } },
                            },
                        },
                    },
                },
                reports: { where: { status: { in: ['draft', 'generated', 'approved'] } } },
            },
        });

        if (!bill) throw new AppError('Bill not found', 404);
        if (!bill.billTests.length) {
            throw new AppError('No collected tests found for this bill.', 422);
        }
        if (bill.reports.length) {
            throw new AppError('A report already exists for this bill.', 422);
        }

        const reportNo = await generateReportNo();
        const verifyUrl = `${labConfig().appUrl}/report/verify/${reportNo}`;

        const report = await prisma.labReport.create({
            data: {
                billId: bill.id,
                patientId: bill.patientId,
                reportNo,
                qrCode: verifyUrl,
                status: 'draft',
                preparedById: preparedById || null,
                preparedAt: new Date(),
                reportTests: {
                    create: buildTestRows(bill.billTests).map((row) => ({
                        labTestId: row.labTestId,
                        profileId: row.profileId,
                        testName: row.testName,
                        unit: row.unit,
                        referenceRange: row.referenceRange,
                        method: row.method,
                        sortOrder: row.sortOrder,
                    })),
                },
            },
        });

        return this.getById(report.id);
    },

    async getById(id) {
        const report = await prisma.labReport.findUnique({
            where: { id: parseId(id) },
            include: reportInclude,
        });

        if (!report) throw new AppError('Report not found', 404);
        report.reportTests = normalizeReportTestOrder(report.reportTests);
        return mapReport(report);
    },

    async getByReportNo(reportNo) {
        const report = await prisma.labReport.findUnique({
            where: { reportNo },
            include: {
                patient: true,
                bill: true,
            },
        });

        if (!report) throw new AppError('Report not found', 404);

        return serialize({
            report_no: report.reportNo,
            patient_name: report.patient.name,
            report_date: report.approvedAt || report.preparedAt || report.createdAt,
            status: report.status,
            authenticity_message: report.status === 'approved'
                ? 'This report is authentic and verified by the laboratory.'
                : 'This report is registered but not yet fully approved.',
        });
    },

    async saveResults(id, data) {
        const { results, remarks, prepared_by_id } = data;

        const report = await prisma.labReport.findUnique({
            where: { id: parseId(id) },
            include: { reportTests: true },
        });

        if (!report) throw new AppError('Report not found', 404);
        if (report.status === 'approved') {
            throw new AppError('Approved reports cannot be edited.', 422);
        }

        const testMap = Object.fromEntries(report.reportTests.map((rt) => [rt.id, rt]));

        const labTests = await prisma.labTest.findMany({
            where: {
                id: { in: [...new Set(report.reportTests.map((r) => r.labTestId).filter(Boolean))] },
            },
            include: { parameters: true },
        });
        const labTestMap = Object.fromEntries(labTests.map((lt) => [lt.id, lt]));

        for (const item of results) {
            const existing = testMap[item.id];
            if (!existing) continue;

            const labTest = existing.labTestId ? labTestMap[existing.labTestId] : null;
            const param = labTest?.parameters?.find((p) => p.name === existing.testName);
            const minValue = item.min_value ?? param?.minValue ?? labTest?.minValue;
            const maxValue = item.max_value ?? param?.maxValue ?? labTest?.maxValue;
            const flag = detectFlag(item.result_value, minValue, maxValue);

            await prisma.labReportTest.update({
                where: { id: item.id },
                data: {
                    resultValue: item.result_value ?? null,
                    unit: item.unit !== undefined ? item.unit : existing.unit,
                    referenceRange: item.reference_range !== undefined ? item.reference_range : existing.referenceRange,
                    flag,
                },
            });
        }

        await prisma.labReport.update({
            where: { id: parseId(id) },
            data: {
                remarks: remarks ?? report.remarks,
                preparedById: prepared_by_id ?? report.preparedById,
                preparedAt: new Date(),
                status: 'draft',
            },
        });

        return this.getById(id);
    },

    async approve(id, approvedById = null) {
        const report = await prisma.labReport.findUnique({
            where: { id: parseId(id) },
            include: reportInclude,
        });

        if (!report) throw new AppError('Report not found', 404);

        const emptyResults = report.reportTests.filter((rt) => !rt.resultValue?.trim());
        if (emptyResults.length) {
            throw new AppError('Enter all test results before approval.', 422, {
                missing: emptyResults.map((r) => r.testName),
            });
        }

        const pdfPath = await this.createPdfForReport(report);

        await prisma.labReport.update({
            where: { id: parseId(id) },
            data: {
                status: 'approved',
                approvedById: approvedById || null,
                approvedAt: new Date(),
                pdfPath,
            },
        });

        await prisma.billTest.updateMany({
            where: { billId: report.billId },
            data: { status: 'completed' },
        });

        return this.getById(id);
    },

    async createPdfForReport(report) {
        const samples = await prisma.sample.findMany({
            where: { billId: report.billId, status: { in: ['collected', 'processing', 'completed'] } },
            orderBy: { collectedAt: 'asc' },
            include: { collectedBy: { select: { name: true } } },
        });
        return generateReportPdf(report, samples);
    },

    async ensurePdfFile(report) {
        if (!['approved', 'generated'].includes(report.status)) {
            throw new AppError('PDF not generated yet. Approve the report first.', 404);
        }

        try {
            const pdfPath = await this.createPdfForReport(report);

            await prisma.labReport.update({
                where: { id: report.id },
                data: { pdfPath },
            });

            const filePath = path.join(REPORTS_DIR, path.basename(pdfPath));
            return { filePath, relative: pdfPath };
        } catch (err) {
            throw new AppError(
                err.message?.includes('Chrome not found')
                    ? 'PDF generation failed: Chrome not installed on server. Run: npm run browsers:install -w backend'
                    : `PDF generation failed: ${err.message || 'Unknown error'}`,
                500,
            );
        }
    },

    getPdfFilePath(report) {
        if (!report.pdfPath && !report.pdf_path) {
            throw new AppError('PDF not generated yet. Approve the report first.', 404);
        }

        const relative = report.pdfPath || report.pdf_path;
        const filePath = path.join(REPORTS_DIR, path.basename(relative));

        if (!fs.existsSync(filePath)) {
            throw new AppError('PDF file not found on server.', 404);
        }

        return { filePath, relative };
    },

    async getDownload(id) {
        const report = await prisma.labReport.findUnique({
            where: { id: parseId(id) },
            include: reportInclude,
        });
        if (!report) throw new AppError('Report not found', 404);
        return this.ensurePdfFile(report);
    },

    getPublicPdfUrl(report) {
        const relative = report.pdfPath || report.pdf_path;
        if (!relative) return null;
        return `${labConfig().appUrl}${relative}`;
    },
};
