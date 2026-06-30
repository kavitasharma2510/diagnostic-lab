import fs from 'fs';
import path from 'path';
import prisma from '../lib/prisma.js';
import { REPORTS_DIR } from '../templates/reportPdfTemplate.js';

function retentionMonths() {
    const parsed = Number(process.env.DATA_RETENTION_MONTHS);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function cutoffDate() {
    const date = new Date();
    date.setMonth(date.getMonth() - retentionMonths());
    return date;
}

function deletePdfFile(pdfPath) {
    if (!pdfPath) return;
    const filePath = path.join(REPORTS_DIR, path.basename(pdfPath));
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
}

export async function runDataCleanup() {
    const cutoff = cutoffDate();
    const months = retentionMonths();

    const oldReports = await prisma.labReport.findMany({
        where: { createdAt: { lt: cutoff } },
        select: { id: true, pdfPath: true },
    });

    for (const report of oldReports) {
        deletePdfFile(report.pdfPath);
    }

    const reportsDeleted = await prisma.labReport.deleteMany({
        where: { createdAt: { lt: cutoff } },
    });

    const billsDeleted = await prisma.bill.deleteMany({
        where: { createdAt: { lt: cutoff } },
    });

    const orphanPatients = await prisma.patient.findMany({
        where: {
            createdAt: { lt: cutoff },
            bills: { none: {} },
        },
        select: { id: true },
    });

    let patientsDeleted = 0;
    for (const patient of orphanPatients) {
        await prisma.patient.delete({ where: { id: patient.id } });
        patientsDeleted += 1;
    }

    const summary = {
        cutoff: cutoff.toISOString(),
        retentionMonths: months,
        reportsDeleted: reportsDeleted.count,
        billsDeleted: billsDeleted.count,
        patientsDeleted,
    };

    console.log('[data-cleanup]', JSON.stringify(summary));
    return summary;
}

function msUntilNextMonthlyRun() {
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1, 2, 0, 0, 0);
    return Math.max(next - now, 60_000);
}

export function scheduleMonthlyDataCleanup() {
    if (process.env.ENABLE_DATA_CLEANUP === 'false') {
        console.log('[data-cleanup] Monthly cleanup disabled (ENABLE_DATA_CLEANUP=false)');
        return;
    }

    const scheduleNext = () => {
        const delay = msUntilNextMonthlyRun();
        setTimeout(async () => {
            try {
                await runDataCleanup();
            } catch (err) {
                console.error('[data-cleanup] Failed:', err.message || err);
            }
            scheduleNext();
        }, delay);
    };

    const nextRun = new Date(Date.now() + msUntilNextMonthlyRun());
    console.log(
        `[data-cleanup] Scheduled monthly cleanup (retention: ${retentionMonths()} month(s), next run: ${nextRun.toISOString()})`,
    );
    scheduleNext();
}
