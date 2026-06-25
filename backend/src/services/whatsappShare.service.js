import { reportGenerationService } from './reportGeneration.service.js';
import { AppError } from '../middleware/errorHandler.js';
import { labConfig } from '../templates/reportPdfTemplate.js';

function formatMobile(mobile) {
    if (!mobile) return null;
    const digits = String(mobile).replace(/\D/g, '');
    if (digits.length < 10) return null;
    return digits.length === 10 ? `91${digits}` : digits;
}

export const whatsappShareService = {
    async getShareLink(reportId) {
        const report = await reportGenerationService.getById(reportId);

        if (!['generated', 'approved'].includes(report.status) && !report.pdf_path) {
            throw new AppError('Generate and approve the report before sharing.', 422);
        }

        const mobile = formatMobile(report.patient?.mobile);
        if (!mobile) {
            throw new AppError('Patient mobile number is missing. Cannot create WhatsApp link.', 422, {
                mobile: ['Patient mobile number is required for WhatsApp sharing.'],
            });
        }

        const pdfUrl = reportGenerationService.getPublicPdfUrl(report);
        if (!pdfUrl) {
            throw new AppError('PDF URL not available. Approve the report first.', 422);
        }

        const lab = labConfig();
        const message = [
            'Dear Patient,',
            'Your pathology report is ready.',
            '',
            `Patient: ${report.patient?.name || '—'}`,
            `Report No: ${report.report_no}`,
            '',
            'Download Report:',
            pdfUrl,
            '',
            `Regards,`,
            lab.name,
        ].join('\n');

        const waUrl = `https://wa.me/${mobile}?text=${encodeURIComponent(message)}`;

        return {
            whatsapp_url: waUrl,
            patient_mobile: report.patient?.mobile,
            report_pdf_url: pdfUrl,
            message,
        };
    },
};
