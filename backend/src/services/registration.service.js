import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { parseId } from '../utils/parseId.js';
import { patientService } from './patient.service.js';
import { billService } from './bill.service.js';
import { sampleCollectionService } from './sampleCollection.service.js';
import { reportGenerationService } from './reportGeneration.service.js';
import { BILL_TEST_STATUS } from '../utils/billTestStatus.js';

async function autoCollectBillSamples(billId) {
    const bill = await prisma.bill.findUnique({
        where: { id: parseId(billId) },
        include: { billTests: { include: { labTest: true } } },
    });

    if (!bill) throw new AppError('Bill not found', 404);

    const grouped = {};
    for (const bt of bill.billTests) {
        if (bt.status !== BILL_TEST_STATUS.PENDING_SAMPLE) continue;
        const sampleType = bt.labTest?.sampleType || 'Blood';
        if (!grouped[sampleType]) grouped[sampleType] = [];
        grouped[sampleType].push(bt.id);
    }

    for (const [sampleType, billTestIds] of Object.entries(grouped)) {
        await sampleCollectionService.collect({
            bill_id: billId,
            sample_type: sampleType,
            bill_test_ids: billTestIds,
        });
    }
}

export const registrationService = {
    async register(data) {
        let patientId = data.patient_id;

        if (!patientId) {
            if (!data.patient?.name?.trim()) {
                throw new AppError('Patient name is required.', 422, {
                    name: ['Patient name is required.'],
                });
            }
            const patient = await patientService.create(data.patient);
            patientId = patient.id;
        }

        const bill = await billService.create({
            patient_id: patientId,
            lab_test_ids: data.lab_test_ids,
            profile_ids: data.profile_ids || [],
            payment_status: 'Unpaid',
            referred_doctor: data.referred_doctor,
        });

        await autoCollectBillSamples(bill.id);
        const report = await reportGenerationService.generate(bill.id);

        return {
            patient: await patientService.getById(patientId),
            bill,
            report,
        };
    },
};
