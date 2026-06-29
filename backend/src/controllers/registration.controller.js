import { registrationService } from '../services/registration.service.js';

export const registrationController = {
    async register(req, res) {
        const data = await registrationService.register(req.body);
        res.status(201).json({
            message: 'Patient registered. Enter results to complete the report.',
            data,
        });
    },
};
