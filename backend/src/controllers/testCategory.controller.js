import { testCategoryService } from '../services/testCategory.service.js';

export const testCategoryController = {
    async list(req, res) {
        const result = await testCategoryService.list(req.query);
        res.json(result);
    },

    async get(req, res) {
        const data = await testCategoryService.getById(req.params.id);
        res.json({ data });
    },

    async create(req, res) {
        const data = await testCategoryService.create(req.body);
        res.status(201).json({ data });
    },

    async update(req, res) {
        const data = await testCategoryService.update(req.params.id, req.body);
        res.json({ data });
    },

    async remove(req, res) {
        await testCategoryService.remove(req.params.id);
        res.json({ message: 'Test category deleted successfully.' });
    },
};
