import { patientService } from '../services/patient.service.js';

export const patientController = {
    async list(req, res) {
        const result = await patientService.list(req.query);
        res.json(result);
    },

    async get(req, res) {
        const data = await patientService.getById(req.params.id);
        res.json({ data });
    },

    async create(req, res) {
        const data = await patientService.create(req.body);
        res.status(201).json({ data });
    },

    async update(req, res) {
        const data = await patientService.update(req.params.id, req.body);
        res.json({ data });
    },

    async remove(req, res) {
        await patientService.remove(req.params.id);
        res.json({ message: 'Patient deleted successfully.' });
    },
};
