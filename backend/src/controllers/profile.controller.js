import { profileService } from '../services/profile.service.js';

export const profileController = {
    async list(req, res) {
        const result = await profileService.list(req.query);
        res.json(result);
    },

    async get(req, res) {
        const data = await profileService.getById(req.params.id);
        res.json({ data });
    },

    async create(req, res) {
        const data = await profileService.create(req.body);
        res.status(201).json({ data });
    },

    async update(req, res) {
        const data = await profileService.update(req.params.id, req.body);
        res.json({ data });
    },

    async remove(req, res) {
        await profileService.remove(req.params.id);
        res.json({ message: 'Profile deleted successfully.' });
    },

    async syncTests(req, res) {
        const data = await profileService.syncTests(req.params.id, req.body.tests);
        res.json({ data });
    },
};
