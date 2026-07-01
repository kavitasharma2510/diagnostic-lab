import { AppError } from '../middleware/errorHandler.js';
import { patientService } from './patient.service.js';
import { billService } from './bill.service.js';
import { sampleCollectionService } from './sampleCollection.service.js';
import { reportGenerationService } from './reportGeneration.service.js';

export const registrationService = {
    async register(data) {
        let patientId = data.patient_id;
        let patientSummary;

        if (!patientId) {
            if (!data.patient?.name?.trim()) {
                throw new AppError('Patient name is required.', 422, {
                    name: ['Patient name is required.'],
                });
            }
            const patient = await patientService.create(data.patient);
            patientId = patient.id;
            patientSummary = {
                id: patient.id,
                patient_no: patient.patient_no,
                name: patient.name,
            };
        }

        const bill = await billService.create({
            patient_id: patientId,
            lab_test_ids: data.lab_test_ids,
            profile_ids: data.profile_ids || [],
            payment_status: 'Unpaid',
            referred_doctor: data.referred_doctor,
        });

        await sampleCollectionService.autoCollectForBill(bill.id);
        const report = await reportGenerationService.generate(bill.id);

        if (!patientSummary) {
            patientSummary = {
                id: bill.patient?.id || patientId,
                patient_no: bill.patient?.patient_no,
                name: bill.patient?.name,
            };
        }

        return {
            patient: patientSummary,
            bill: {
                id: bill.id,
                bill_no: bill.bill_no,
            },
            report,
        };
    },
};
