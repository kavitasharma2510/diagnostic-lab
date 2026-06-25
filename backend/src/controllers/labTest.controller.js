import { labTestService } from '../services/labTest.service.js';

export const labTestController = {
    async list(req, res) {
        const result = await labTestService.list(req.query);
        res.json(result);
    },

    async get(req, res) {
        const data = await labTestService.getById(req.params.id);
        res.json({ data });
    },

    async create(req, res) {
        const data = await labTestService.create(req.body);
        res.status(201).json({ data });
    },

    async update(req, res) {
        const data = await labTestService.update(req.params.id, req.body);
        res.json({ data });
    },

    async remove(req, res) {
        await labTestService.remove(req.params.id);
        res.json({ message: 'Test deleted successfully.' });
    },

    async listParameters(req, res) {
        const data = await labTestService.listParameters(req.params.labTestId);
        res.json({ data });
    },

    async createParameter(req, res) {
        const data = await labTestService.createParameter(req.params.labTestId, req.body);
        res.status(201).json({ data });
    },

    async getParameter(req, res) {
        const data = await labTestService.getParameter(req.params.id);
        res.json({ data });
    },

    async updateParameter(req, res) {
        const data = await labTestService.updateParameter(req.params.id, req.body);
        res.json({ data });
    },

    async removeParameter(req, res) {
        await labTestService.removeParameter(req.params.id);
        res.json({ message: 'Test parameter deleted successfully.' });
    },
};
