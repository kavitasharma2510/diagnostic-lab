import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { buildPagination, paginatedResponse, paginatedList } from '../utils/pagination.js';
import { serialize } from '../utils/serialize.js';
import { parseId, parseIds } from '../utils/parseId.js';
import { BILL_TEST_STATUS } from '../utils/billTestStatus.js';

const SAMPLE_STATUSES = ['pending', 'collected', 'processing', 'completed', 'rejected'];

async function generateSampleNo(db = prisma) {
    const today = new Date();
    const prefix = `SMP-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;

    const last = await db.sample.findFirst({
        where: { sampleNo: { startsWith: prefix } },
        orderBy: { sampleNo: 'desc' },
    });

    const sequence = last ? Number(last.sampleNo.split('-').pop()) + 1 : 1;
    return `${prefix}-${String(sequence).padStart(4, '0')}`;
}

async function generateBarcode(db = prisma) {
    const today = new Date();
    const prefix = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;

    const last = await db.sample.findFirst({
        where: { barcode: { startsWith: prefix } },
        orderBy: { barcode: 'desc' },
    });

    const sequence = last ? Number(last.barcode.slice(prefix.length)) + 1 : 1;
    return `${prefix}${String(sequence).padStart(5, '0')}`;
}

async function recordStatus(db, sampleId, status, changedById = null, remarks = null) {
    await db.sampleStatusHistory.create({
        data: {
            sampleId,
            status,
            changedById,
            remarks,
        },
    });
}

function mapSample(sample) {
    return serialize({
        ...sample,
        sample_no: sample.sampleNo,
        sample_type: sample.sampleType,
        bill_id: sample.billId,
        patient_id: sample.patientId,
        collected_at: sample.collectedAt,
        collected_by: sample.collectedBy,
        rejected_at: sample.rejectedAt,
        rejected_by: sample.rejectedBy,
        rejection_reason: sample.rejectionReason,
        patient: sample.patient
            ? {
                ...sample.patient,
                patient_no: sample.patient.patientNo,
            }
            : undefined,
        bill: sample.bill
            ? {
                ...sample.bill,
                bill_no: sample.bill.billNo,
                referred_doctor: sample.bill.referredDoctor,
            }
            : undefined,
        sample_tests: sample.sampleTests?.map((st) => ({
            ...serialize(st),
            bill_test_id: st.billTestId,
            lab_test_id: st.labTestId,
            test_name: st.billTest?.testName || st.labTest?.name,
        })),
        status_history: sample.statusHistory?.map((h) => ({
            ...serialize(h),
            changed_by: h.changedBy,
        })),
    });
}

export const sampleCollectionService = {
    async listPending(filters = {}) {
        const where = {
            status: BILL_TEST_STATUS.PENDING_SAMPLE,
            sampleTests: { none: {} },
            labTestId: { not: null },
        };

        if (filters.bill_no) {
            where.bill = { billNo: { contains: filters.bill_no } };
        }

        if (filters.patient_id) {
            where.bill = { ...where.bill, patientId: parseId(filters.patient_id) };
        }

        if (filters.search) {
            where.OR = [
                { testName: { contains: filters.search } },
                { bill: { billNo: { contains: filters.search } } },
                { bill: { patient: { name: { contains: filters.search } } } },
            ];
        }

        const billTests = await prisma.billTest.findMany({
            where,
            include: {
                bill: { include: { patient: true } },
                labTest: true,
            },
            orderBy: [{ bill: { billDate: 'asc' } }, { id: 'asc' }],
        });

        const grouped = {};

        for (const bt of billTests) {
            const sampleType = bt.labTest?.sampleType || 'Unknown';
            const key = `${bt.billId}-${sampleType}`;

            if (filters.sample_type && !sampleType.toLowerCase().includes(filters.sample_type.toLowerCase())) {
                continue;
            }

            if (!grouped[key]) {
                grouped[key] = {
                    bill_id: bt.billId,
                    bill_no: bt.bill.billNo,
                    bill_date: bt.bill.billDate,
                    referred_doctor: bt.bill.referredDoctor,
                    patient: serialize({
                        ...bt.bill.patient,
                        patient_no: bt.bill.patient.patientNo,
                    }),
                    sample_type: sampleType,
                    bill_test_ids: [],
                    tests: [],
                };
            }

            grouped[key].bill_test_ids.push(bt.id);
            grouped[key].tests.push({
                id: bt.id,
                lab_test_id: bt.labTestId,
                test_name: bt.testName,
                code: bt.labTest?.code,
                price: bt.price,
            });
        }

        return Object.values(grouped);
    },

    async collect(data) {
        const { bill_id, sample_type, bill_test_ids, collected_by_id, remarks } = data;

        if (!bill_test_ids?.length) {
            throw new AppError('Select at least one test to collect.', 422, {
                bill_test_ids: ['Select at least one test to collect.'],
            });
        }

        const bill = await prisma.bill.findUnique({
            where: { id: parseId(bill_id) },
            include: { patient: true },
        });

        if (!bill) {
            throw new AppError('Bill not found', 404);
        }

        const billTests = await prisma.billTest.findMany({
            where: {
                id: { in: bill_test_ids },
                billId: parseId(bill_id),
                status: BILL_TEST_STATUS.PENDING_SAMPLE,
            },
            include: { labTest: true },
        });

        if (billTests.length !== bill_test_ids.length) {
            throw new AppError('One or more tests are invalid or already collected.', 422);
        }

        const sampleNo = await generateSampleNo();
        const barcode = await generateBarcode();

        const sample = await prisma.sample.create({
            data: {
                billId: parseId(bill_id),
                patientId: bill.patientId,
                sampleNo,
                barcode,
                sampleType: sample_type,
                status: 'collected',
                collectedById: collected_by_id || null,
                collectedAt: new Date(),
                remarks: remarks || null,
            },
        });

        await recordStatus(prisma, sample.id, 'pending', collected_by_id, 'Sample record created');
        await recordStatus(prisma, sample.id, 'collected', collected_by_id, remarks);

        for (const bt of billTests) {
            await prisma.sampleTest.create({
                data: {
                    sampleId: sample.id,
                    billTestId: bt.id,
                    labTestId: bt.labTestId,
                    status: 'collected',
                },
            });

            await prisma.billTest.update({
                where: { id: bt.id },
                data: { status: BILL_TEST_STATUS.COLLECTED },
            });
        }

        return this.getById(sample.id);
    },

    async autoCollectForBill(billId) {
        const id = parseId(billId);

        await prisma.$transaction(async (tx) => {
            const billTests = await tx.billTest.findMany({
                where: { billId: id, status: BILL_TEST_STATUS.PENDING_SAMPLE },
                include: { labTest: true },
            });
            if (!billTests.length) return;

            const bill = await tx.bill.findUnique({
                where: { id },
                select: { patientId: true },
            });
            if (!bill) throw new AppError('Bill not found', 404);

            const grouped = new Map();
            for (const bt of billTests) {
                const sampleType = bt.labTest?.sampleType || 'Blood';
                if (!grouped.has(sampleType)) grouped.set(sampleType, []);
                grouped.get(sampleType).push(bt);
            }

            const collectedAt = new Date();
            for (const [sampleType, tests] of grouped.entries()) {
                const sampleNo = await generateSampleNo(tx);
                const barcode = await generateBarcode(tx);
                const sample = await tx.sample.create({
                    data: {
                        billId: id,
                        patientId: bill.patientId,
                        sampleNo,
                        barcode,
                        sampleType,
                        status: 'collected',
                        collectedAt,
                    },
                });

                await tx.sampleStatusHistory.createMany({
                    data: [
                        { sampleId: sample.id, status: 'pending', remarks: 'Sample record created' },
                        { sampleId: sample.id, status: 'collected' },
                    ],
                });

                await tx.sampleTest.createMany({
                    data: tests.map((bt) => ({
                        sampleId: sample.id,
                        billTestId: bt.id,
                        labTestId: bt.labTestId,
                        status: 'collected',
                    })),
                });

                await tx.billTest.updateMany({
                    where: { id: { in: tests.map((bt) => bt.id) } },
                    data: { status: BILL_TEST_STATUS.COLLECTED },
                });
            }
        });
    },

    async list(filters = {}) {
        const { currentPage, limit, skip } = buildPagination(filters.page, filters.per_page);
        const where = {};

        if (filters.status) {
            where.status = filters.status;
        }

        if (filters.sample_type) {
            where.sampleType = { contains: filters.sample_type };
        }

        if (filters.bill_no) {
            where.bill = { billNo: { contains: filters.bill_no } };
        }

        if (filters.patient_id) {
            where.patientId = parseId(filters.patient_id);
        }

        if (filters.search) {
            where.OR = [
                { sampleNo: { contains: filters.search } },
                { barcode: { contains: filters.search } },
                { patient: { name: { contains: filters.search } } },
                { bill: { billNo: { contains: filters.search } } },
            ];
        }

        if (filters.date_from || filters.date_to) {
            where.createdAt = {};
            if (filters.date_from) where.createdAt.gte = new Date(filters.date_from);
            if (filters.date_to) {
                const end = new Date(filters.date_to);
                end.setHours(23, 59, 59, 999);
                where.createdAt.lte = end;
            }
        }

        const [total, rows] = await paginatedList(
            prisma.sample.count({ where }),
            prisma.sample.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    patient: true,
                    bill: true,
                    collectedBy: { select: { id: true, name: true } },
                    _count: { select: { sampleTests: true } },
                },
            }),
        );

        const data = rows.map((row) => mapSample({
            ...row,
            tests_count: row._count.sampleTests,
        }));

        return paginatedResponse(data, total, currentPage, limit);
    },

    async getById(id) {
        const sample = await prisma.sample.findUnique({
            where: { id: parseId(id) },
            include: {
                patient: true,
                bill: true,
                collectedBy: { select: { id: true, name: true } },
                rejectedBy: { select: { id: true, name: true } },
                sampleTests: {
                    include: {
                        billTest: true,
                        labTest: true,
                    },
                },
                statusHistory: {
                    orderBy: { createdAt: 'asc' },
                    include: { changedBy: { select: { id: true, name: true } } },
                },
            },
        });

        if (!sample) {
            throw new AppError('Sample not found', 404);
        }

        return mapSample(sample);
    },

    async reject(id, data) {
        const { rejection_reason, rejected_by_id } = data;

        if (!rejection_reason?.trim()) {
            throw new AppError('Rejection reason is required.', 422, {
                rejection_reason: ['Rejection reason is required.'],
            });
        }

        const sample = await prisma.sample.findUnique({
            where: { id: parseId(id) },
            include: { sampleTests: true },
        });

        if (!sample) {
            throw new AppError('Sample not found', 404);
        }

        if (sample.status === 'rejected') {
            throw new AppError('Sample is already rejected.', 422);
        }

        await prisma.sample.update({
            where: { id: parseId(id) },
            data: {
                status: 'rejected',
                rejectedById: rejected_by_id || null,
                rejectedAt: new Date(),
                rejectionReason: rejection_reason,
            },
        });

        await prisma.sampleTest.updateMany({
            where: { sampleId: parseId(id) },
            data: { status: 'rejected' },
        });

        for (const st of sample.sampleTests) {
            await prisma.billTest.update({
                where: { id: st.billTestId },
                data: { status: BILL_TEST_STATUS.PENDING_SAMPLE },
            });
        }

        await recordStatus(prisma, parseId(id), 'rejected', rejected_by_id, rejection_reason);

        return this.getById(id);
    },

    async updateStatus(id, data) {
        const { status, changed_by_id, remarks } = data;

        if (!SAMPLE_STATUSES.includes(status)) {
            throw new AppError('Invalid sample status.', 422);
        }

        const sample = await prisma.sample.findUnique({ where: { id: parseId(id) } });
        if (!sample) throw new AppError('Sample not found', 404);

        await prisma.sample.update({
            where: { id: parseId(id) },
            data: { status },
        });

        if (status === 'processing' || status === 'completed') {
            await prisma.sampleTest.updateMany({
                where: { sampleId: parseId(id) },
                data: { status },
            });
        }

        await recordStatus(prisma, parseId(id), status, changed_by_id, remarks);

        return this.getById(id);
    },

    getBarcodeLabel(id) {
        return this.getById(id).then((sample) => ({
            lab_name: process.env.LAB_NAME || 'Diagnostic Laboratory',
            sample_no: sample.sample_no,
            barcode: sample.barcode,
            sample_type: sample.sample_type,
            patient_name: sample.patient?.name,
            patient_no: sample.patient?.patient_no,
            bill_no: sample.bill?.bill_no,
            collected_at: sample.collected_at,
        }));
    },
};
