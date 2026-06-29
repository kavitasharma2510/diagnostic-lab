import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { buildPagination, paginatedResponse, paginatedList } from '../utils/pagination.js';
import { serialize } from '../utils/serialize.js';
import { parseId } from '../utils/parseId.js';
import { BILL_TEST_STATUS } from '../utils/billTestStatus.js';

function mapBill(row) {
    return serialize({
        ...row,
        bill_no: row.billNo,
        bill_date: row.billDate,
        total_amount: row.totalAmount,
        payment_status: row.paymentStatus,
        referred_doctor: row.referredDoctor,
        patient: row.patient
            ? {
                ...serialize(row.patient),
                patient_no: row.patient.patientNo,
                referring_doctor: row.patient.referringDoctor,
            }
            : undefined,
        bill_tests: row.billTests?.map((bt) => ({
            ...serialize(bt),
            lab_test_id: bt.labTestId,
            profile_id: bt.profileId,
            test_name: bt.testName,
            lab_test: bt.labTest ? serialize({ ...bt.labTest, sample_type: bt.labTest.sampleType }) : undefined,
            profile: bt.profile ? serialize(bt.profile) : undefined,
        })),
        tests_count: row._count?.billTests ?? row.billTests?.length,
    });
}

async function generateBillNo(db = prisma) {
    const today = new Date();
    const prefix = `BILL-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;

    const last = await db.bill.findFirst({
        where: { billNo: { startsWith: prefix } },
        orderBy: { billNo: 'desc' },
    });

    const sequence = last ? Number(last.billNo.split('-').pop()) + 1 : 1;
    return `${prefix}-${String(sequence).padStart(4, '0')}`;
}

async function expandBillLineItems(labTestIds = [], profileIds = []) {
    const items = [];
    const seen = new Set();

    for (const profileId of profileIds) {
        const profile = await prisma.profile.findUnique({
            where: { id: parseId(profileId) },
            include: {
                items: {
                    orderBy: { sortOrder: 'asc' },
                    include: { labTest: true },
                },
            },
        });

        if (!profile) {
            throw new AppError(`Profile not found: ${profileId}`, 422);
        }

        if (!profile.items.length) {
            throw new AppError(`Profile "${profile.name}" has no tests.`, 422);
        }

        for (const item of profile.items) {
            if (!item.labTest || seen.has(item.labTestId)) continue;
            seen.add(item.labTestId);
            items.push({
                labTestId: item.labTestId,
                profileId: profile.id,
                testName: item.labTest.name,
                price: item.labTest.price,
            });
        }
    }

    for (const labTestId of labTestIds) {
        const id = parseId(labTestId);
        if (seen.has(id)) continue;

        const labTest = await prisma.labTest.findUnique({ where: { id } });
        if (!labTest) {
            throw new AppError(`Lab test not found: ${labTestId}`, 422);
        }

        seen.add(id);
        items.push({
            labTestId: labTest.id,
            profileId: null,
            testName: labTest.name,
            price: labTest.price,
        });
    }

    if (!items.length) {
        throw new AppError('Select at least one lab test or profile.', 422);
    }

    return items;
}

export const billService = {
    async list(filters = {}) {
        const { currentPage, limit, skip } = buildPagination(filters.page, filters.per_page);
        const where = {};

        if (filters.patient_id) {
            where.patientId = parseId(filters.patient_id);
        }

        if (filters.payment_status) {
            where.paymentStatus = filters.payment_status;
        }

        if (filters.search) {
            where.OR = [
                { billNo: { contains: filters.search } },
                { patient: { name: { contains: filters.search } } },
                { patient: { patientNo: { contains: filters.search } } },
            ];
        }

        const [total, rows] = await paginatedList(
            prisma.bill.count({ where }),
            prisma.bill.findMany({
                where,
                skip,
                take: limit,
                orderBy: { billDate: 'desc' },
                include: {
                    patient: true,
                    _count: { select: { billTests: true } },
                },
            }),
        );

        return paginatedResponse(rows.map(mapBill), total, currentPage, limit);
    },

    async getById(id) {
        const bill = await prisma.bill.findUnique({
            where: { id: parseId(id) },
            include: {
                patient: true,
                billTests: {
                    include: { labTest: true, profile: true },
                    orderBy: { createdAt: 'asc' },
                },
            },
        });

        if (!bill) throw new AppError('Bill not found', 404);
        return mapBill(bill);
    },

    async create(data) {
        const patient = await prisma.patient.findUnique({
            where: { id: parseId(data.patient_id) },
        });

        if (!patient) throw new AppError('Patient not found', 404);

        const lineItems = await expandBillLineItems(data.lab_test_ids, data.profile_ids);
        const totalAmount = lineItems.reduce((sum, item) => sum + Number(item.price || 0), 0);

        const billNo = await generateBillNo();
        const bill = await prisma.bill.create({
            data: {
                billNo,
                patientId: patient.id,
                referredDoctor: data.referred_doctor ?? patient.referringDoctor ?? null,
                totalAmount,
                paymentStatus: data.payment_status || 'Unpaid',
                status: 'open',
                remarks: data.remarks ?? null,
                billTests: {
                    create: lineItems.map((item) => ({
                        labTestId: item.labTestId,
                        profileId: item.profileId,
                        testName: item.testName,
                        price: item.price,
                        status: BILL_TEST_STATUS.PENDING_SAMPLE,
                    })),
                },
            },
            include: {
                patient: true,
                billTests: { include: { labTest: true, profile: true } },
            },
        });

        return mapBill(bill);
    },

    async update(id, data) {
        const billId = parseId(id);
        const existing = await prisma.bill.findUnique({
            where: { id: billId },
            include: { billTests: true },
        });

        if (!existing) throw new AppError('Bill not found', 404);

        const payload = {};
        if (data.payment_status !== undefined) payload.paymentStatus = data.payment_status;
        if (data.referred_doctor !== undefined) payload.referredDoctor = data.referred_doctor;
        if (data.remarks !== undefined) payload.remarks = data.remarks;

        const bill = await prisma.bill.update({
            where: { id: billId },
            data: payload,
            include: {
                patient: true,
                billTests: { include: { labTest: true, profile: true } },
            },
        });

        return mapBill(bill);
    },

    async remove(id) {
        const billId = parseId(id);
        const bill = await prisma.bill.findUnique({
            where: { id: billId },
            include: { billTests: true, samples: true },
        });

        if (!bill) throw new AppError('Bill not found', 404);

        const hasCollected = bill.billTests.some((bt) => bt.status !== BILL_TEST_STATUS.PENDING_SAMPLE);
        if (hasCollected || bill.samples.length > 0) {
            throw new AppError('Cannot delete bill after sample collection has started.', 422);
        }

        await prisma.bill.delete({ where: { id: billId } });
    },
};
