import { reportGenerationService } from './reportGeneration.service.js';
import { AppError } from '../middleware/errorHandler.js';
import { labConfig } from '../templates/reportPdfTemplate.js';

function formatMobile(mobile) {
    if (!mobile) return null;
    const digits = String(mobile).replace(/\D/g, '');
    if (digits.length < 10) return null;
    return digits.length === 10 ? `91${digits}` : digits;
}

function parseMobileList(mobilesInput) {
    if (!mobilesInput) return [];

    const raw = Array.isArray(mobilesInput)
        ? mobilesInput
        : String(mobilesInput).split(/[,;\n]+/);

    const formatted = raw
        .map((entry) => formatMobile(entry))
        .filter(Boolean);

    return [...new Set(formatted)];
}

function buildShareMessage(report, pdfUrl) {
    const lab = labConfig();
    return [
        'Dear Patient,',
        'Your pathology report is ready.',
        '',
        `Patient: ${report.patient?.name || '—'}`,
        `Report No: ${report.report_no}`,
        '',
        pdfUrl,
        '',
        'Regards,',
        lab.name,
    ].join('\n');
}

function isLocalShareUrl(url) {
    return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(url || '');
}

export const whatsappShareService = {
    async getShareLink(reportId, mobilesInput) {
        const report = await reportGenerationService.getById(reportId);

        if (!['generated', 'approved'].includes(report.status) && !report.pdf_path) {
            throw new AppError('Generate and approve the report before sharing.', 422);
        }

        const pdfUrl = reportGenerationService.getPublicShareUrl(report);
        if (!pdfUrl) {
            throw new AppError('PDF URL not available. Approve the report first.', 422);
        }

        let mobiles = parseMobileList(mobilesInput);
        if (!mobiles.length) {
            const patientMobile = formatMobile(report.patient?.mobile);
            if (patientMobile) mobiles = [patientMobile];
        }

        if (!mobiles.length) {
            throw new AppError('Enter at least one mobile number for WhatsApp sharing.', 422, {
                mobile: ['Add one or more valid mobile numbers.'],
            });
        }

        const message = buildShareMessage(report, pdfUrl);
        const whatsapp_urls = mobiles.map((mobile) => ({
            mobile,
            whatsapp_url: `https://wa.me/${mobile}?text=${encodeURIComponent(message)}`,
        }));

        return {
            whatsapp_urls,
            whatsapp_url: whatsapp_urls[0].whatsapp_url,
            patient_mobile: report.patient?.mobile,
            mobiles,
            report_pdf_url: pdfUrl,
            message,
            share_url_warning: isLocalShareUrl(pdfUrl)
                ? 'Links use localhost and will not be clickable on patient phones. Set APP_URL in backend .env to your public HTTPS domain (e.g. https://your-lab.com).'
                : null,
        };
    },
};
