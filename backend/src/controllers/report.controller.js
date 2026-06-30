import path from 'path';
import { reportGenerationService } from '../services/reportGeneration.service.js';
import { whatsappShareService } from '../services/whatsappShare.service.js';
import { verificationHtml } from '../templates/verificationPage.js';

export const reportController = {
    async list(req, res) {
        const result = await reportGenerationService.list(req.query);
        res.json(result);
    },

    async eligibleBills(req, res) {
        const data = await reportGenerationService.getEligibleBills();
        res.json({ data });
    },

    async generate(req, res) {
        const data = await reportGenerationService.generate(req.params.billId, req.body?.prepared_by_id);
        res.status(201).json({ data });
    },

    async get(req, res) {
        const data = await reportGenerationService.getById(req.params.id);
        res.json({ data });
    },

    async saveResults(req, res) {
        const data = await reportGenerationService.saveResults(req.params.id, req.body);
        res.json({ data });
    },

    async approve(req, res) {
        const data = await reportGenerationService.approve(req.params.id, req.body?.approved_by_id);
        res.json({ data });
    },

    async download(req, res) {
        const { filePath, relative } = await reportGenerationService.getDownload(req.params.id);
        res.download(filePath, path.basename(relative));
    },

    async preview(req, res) {
        const { filePath } = await reportGenerationService.getDownload(req.params.id);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline');
        res.sendFile(filePath);
    },

    async verify(req, res) {
        const data = await reportGenerationService.getByReportNo(req.params.reportNo);
        if (req.accepts('html')) {
            return res.type('html').send(verificationHtml(data));
        }
        res.json({ data });
    },

    async whatsappLink(req, res) {
        const data = await whatsappShareService.getShareLink(req.params.id);
        res.json({ data });
    },

    async remove(req, res) {
        await reportGenerationService.remove(req.params.id);
        res.status(204).send();
    },
};
