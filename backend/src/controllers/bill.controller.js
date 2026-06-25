import { billService } from '../services/bill.service.js';

export const billController = {
    async list(req, res) {
        const result = await billService.list(req.query);
        res.json(result);
    },

    async get(req, res) {
        const data = await billService.getById(req.params.id);
        res.json({ data });
    },

    async create(req, res) {
        const data = await billService.create(req.body);
        res.status(201).json({ data });
    },

    async update(req, res) {
        const data = await billService.update(req.params.id, req.body);
        res.json({ data });
    },

    async remove(req, res) {
        await billService.remove(req.params.id);
        res.json({ message: 'Bill deleted successfully.' });
    },
};
