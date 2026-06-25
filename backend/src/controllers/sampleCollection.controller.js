import { sampleCollectionService } from '../services/sampleCollection.service.js';

export const sampleCollectionController = {
    async listPending(req, res) {
        const data = await sampleCollectionService.listPending(req.query);
        res.json({ data });
    },

    async collect(req, res) {
        const data = await sampleCollectionService.collect(req.body);
        res.status(201).json({ data });
    },

    async list(req, res) {
        const result = await sampleCollectionService.list(req.query);
        res.json(result);
    },

    async get(req, res) {
        const data = await sampleCollectionService.getById(req.params.id);
        res.json({ data });
    },

    async reject(req, res) {
        const data = await sampleCollectionService.reject(req.params.id, req.body);
        res.json({ data });
    },

    async updateStatus(req, res) {
        const data = await sampleCollectionService.updateStatus(req.params.id, req.body);
        res.json({ data });
    },

    async barcodeLabel(req, res) {
        const data = await sampleCollectionService.getBarcodeLabel(req.params.id);
        res.json({ data });
    },
};
