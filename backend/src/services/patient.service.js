import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { buildPagination, paginatedResponse, paginatedList } from '../utils/pagination.js';
import { serialize } from '../utils/serialize.js';
import { parseId } from '../utils/parseId.js';
import fs from 'fs';
import path from 'path';
import { REPORTS_DIR } from '../templates/reportPdfTemplate.js';

function deleteReportPdf(pdfPath) {
    if (!pdfPath) return;
    const filePath = path.join(REPORTS_DIR, path.basename(pdfPath));
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
}

function mapPatient(row) {
    return serialize({
        ...row,
        patient_no: row.patientNo,
        patient_id: row.patientNo,
        referring_doctor: row.referringDoctor,
        date_of_birth: row.dateOfBirth,
    });
}

async function generatePatientNo(db = prisma) {
    const today = new Date();
    const prefix = `PAT-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;

    const last = await db.patient.findFirst({
        where: { patientNo: { startsWith: prefix } },
        orderBy: { patientNo: 'desc' },
    });

    const sequence = last ? Number(last.patientNo.split('-').pop()) + 1 : 1;
    return `${prefix}-${String(sequence).padStart(4, '0')}`;
}

export const patientService = {
    async list(filters = {}) {
        const { currentPage, limit, skip } = buildPagination(filters.page, filters.per_page);
        const where = {};

        if (filters.search) {
            where.OR = [
                { name: { contains: filters.search } },
                { patientNo: { contains: filters.search } },
                { mobile: { contains: filters.search } },
            ];
        }

        if (filters.gender) {
            where.gender = filters.gender;
        }

        const [total, rows] = await paginatedList(
            prisma.patient.count({ where }),
            prisma.patient.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
        );

        return paginatedResponse(rows.map(mapPatient), total, currentPage, limit);
    },

    async getById(id) {
        const patient = await prisma.patient.findUnique({
            where: { id: parseId(id) },
            include: {
                _count: { select: { bills: true } },
            },
        });

        if (!patient) throw new AppError('Patient not found', 404);
        return mapPatient({ ...patient, bills_count: patient._count.bills });
    },

    async create(data) {
        const patientNo = await generatePatientNo();
        const patient = await prisma.patient.create({
            data: {
                patientNo,
                name: data.name,
                age: data.age ?? null,
                gender: data.gender ?? null,
                mobile: data.mobile ?? null,
                address: data.address ?? null,
                referringDoctor: data.referring_doctor ?? null,
            },
        });

        return mapPatient(patient);
    },

    async update(id, data) {
        const payload = {};
        if (data.name !== undefined) payload.name = data.name;
        if (data.age !== undefined) payload.age = data.age;
        if (data.gender !== undefined) payload.gender = data.gender;
        if (data.mobile !== undefined) payload.mobile = data.mobile;
        if (data.address !== undefined) payload.address = data.address;
        if (data.referring_doctor !== undefined) payload.referringDoctor = data.referring_doctor;

        try {
            const patient = await prisma.patient.update({
                where: { id: parseId(id) },
                data: payload,
            });
            return mapPatient(patient);
        } catch {
            throw new AppError('Patient not found', 404);
        }
    },

    async remove(id) {
        const patientId = parseId(id);
        const patient = await prisma.patient.findUnique({ where: { id: patientId } });
        if (!patient) throw new AppError('Patient not found', 404);

        const reports = await prisma.labReport.findMany({
            where: { patientId },
            select: { id: true, pdfPath: true },
        });

        for (const report of reports) {
            deleteReportPdf(report.pdfPath);
        }

        await prisma.labReportTest.deleteMany({
            where: { labReport: { patientId } },
        });
        await prisma.labReport.deleteMany({ where: { patientId } });

        const samples = await prisma.sample.findMany({
            where: { patientId },
            select: { id: true },
        });

        for (const sample of samples) {
            await prisma.sampleTest.deleteMany({ where: { sampleId: sample.id } });
            await prisma.sampleStatusHistory.deleteMany({ where: { sampleId: sample.id } });
        }
        await prisma.sample.deleteMany({ where: { patientId } });

        const bills = await prisma.bill.findMany({
            where: { patientId },
            select: { id: true },
        });

        for (const bill of bills) {
            await prisma.billTest.deleteMany({ where: { billId: bill.id } });
        }
        await prisma.bill.deleteMany({ where: { patientId } });

        await prisma.patient.delete({ where: { id: patientId } });
    },
};
