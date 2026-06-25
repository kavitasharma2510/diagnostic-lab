import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { launchPuppeteer } from '../utils/puppeteerLaunch.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = path.join(__dirname, '../../public/reports');

async function loadPdfDeps() {
    const [bwipjs, QRCode, puppeteer] = await Promise.all([
        import('bwip-js'),
        import('qrcode'),
        import('puppeteer'),
    ]);
    return {
        bwipjs: bwipjs.default || bwipjs,
        QRCode: QRCode.default || QRCode,
        puppeteer: puppeteer.default || puppeteer,
    };
}

function labConfig() {
    return {
        name: process.env.LAB_NAME || 'TYAGI PATHOLOGY',
        namePart1: process.env.LAB_NAME_PART1 || 'TYAGI',
        namePart2: process.env.LAB_NAME_PART2 || 'PATHOLOGY',
        tagline: process.env.LAB_TAGLINE || 'ACCURATE REPORTS, ADVANCED TECHNOLOGY',
        address: process.env.LAB_ADDRESS || 'HOSPITAL ROAD INFRONT OF KUND BAGAR, BARODA DISTT. SHEOPUR (M.P.)',
        phone: process.env.LAB_PHONE || '9399785895',
        email: process.env.LAB_EMAIL || 'prankulsharma2@gmail.com',
        ownerName: process.env.LAB_OWNER_NAME || 'PRANKUL SHARMA',
        signatureName: process.env.LAB_SIGNATURE_NAME || 'Prankul Sharma',
        signatureTitle: process.env.LAB_SIGNATURE_TITLE || 'Lab Technician',
        appUrl: process.env.APP_URL || 'http://localhost:5000',
        letterheadFile: process.env.LAB_LETTERHEAD_FILE || 'tyagi-letterhead.png',
    };
}

function loadLetterheadDataUrl(filename) {
    const assetPath = path.join(__dirname, '../../public/assets', filename);
    if (!fs.existsSync(assetPath)) return '';
    return `data:image/png;base64,${fs.readFileSync(assetPath).toString('base64')}`;
}

function formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(d) {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-IN');
}

async function toBarcodeDataUrl(value) {
    if (!value) return '';
    const { bwipjs } = await loadPdfDeps();
    const png = await bwipjs.toBuffer({
        bcid: 'code128',
        text: value,
        scale: 2,
        height: 10,
        includetext: true,
        textxalign: 'center',
    });
    return `data:image/png;base64,${png.toString('base64')}`;
}

async function toQrDataUrl(url) {
    const { QRCode } = await loadPdfDeps();
    return QRCode.toDataURL(url, { margin: 1, width: 120 });
}

function groupReportTests(reportTests) {
    const groups = [];
    const byLabTest = {};

    for (const rt of reportTests) {
        const key = rt.labTestId || rt.testName;
        if (!byLabTest[key]) {
            byLabTest[key] = {
                heading: rt.labTest?.name || rt.testName,
                reportType: rt.labTest?.reportType || 'single',
                category: rt.labTest?.category?.name,
                rows: [],
                interpretation: rt.remarks || '',
            };
            groups.push(byLabTest[key]);
        }
        byLabTest[key].rows.push(rt);
        if (rt.remarks && (rt.labTest?.reportType === 'single' || rt.labTest?.reportType === 'serology')) {
            byLabTest[key].interpretation = rt.remarks;
        }
    }

    return groups;
}

export async function buildReportHtml(report, samples = []) {
    const lab = labConfig();
    const letterheadDataUrl = loadLetterheadDataUrl(lab.letterheadFile);
    const verifyUrl = `${lab.appUrl}/report/verify/${report.reportNo}`;
    const qrDataUrl = await toQrDataUrl(verifyUrl);
    const primarySample = samples[0];
    const barcodeDataUrl = primarySample?.barcode ? await toBarcodeDataUrl(primarySample.barcode) : '';

    const patient = report.patient;
    const ageGender = [patient?.age ? `${patient.age} Yrs` : null, patient?.gender].filter(Boolean).join(' / ') || '—';
    const groups = groupReportTests(report.reportTests || []);

    const groupHtml = groups.map((group) => {
        const isSerology = group.rows.some((r) => r.labTest?.reportType === 'serology' || r.labTest?.code?.includes('HBS') || r.labTest?.code?.includes('HCV') || r.labTest?.code?.includes('HIV'));
        const rows = group.rows.map((r) => `
            <tr>
                <td>${r.testName}</td>
                <td class="result">${r.resultValue || '—'}</td>
                <td>${r.unit || '—'}</td>
                <td>${r.referenceRange || '—'}</td>
                <td>${r.method || '—'}</td>
                <td class="flag ${r.flag === 'High' ? 'high' : r.flag === 'Low' ? 'low' : ''}">${r.flag || '—'}</td>
            </tr>
        `).join('');

        const interpretation = group.interpretation || group.rows.find((r) => r.remarks)?.remarks;

        return `
            <div class="section">
                <h3 class="section-title">${group.heading}${group.category ? ` <span class="cat">(${group.category})</span>` : ''}</h3>
                <table class="results">
                    <thead>
                        <tr>
                            <th>Test Name</th>
                            <th>Result</th>
                            <th>Unit</th>
                            <th>Reference Range</th>
                            <th>Method</th>
                            <th>Flag</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
                ${isSerology || interpretation ? `
                    <div class="interpretation">
                        <strong>Remarks / Interpretation:</strong>
                        <p>${interpretation || 'See result values above.'}</p>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');

    const useLetterhead = Boolean(letterheadDataUrl);

    // Content safe-zone inside the letterhead blank area (no stretch — background-size: 100% auto)
    const contentPad = useLetterhead
        ? '118px 44px 128px 44px'
        : '24px';

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <title>Report ${report.reportNo}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=swap');
        @page { size: A4 portrait; margin: 0; }
        * { box-sizing: border-box; }
        html, body {
            margin: 0;
            padding: 0;
            width: 210mm;
            font-family: 'Roboto', Arial, Helvetica, sans-serif;
            font-size: 10.5px;
            color: #0d1b3e;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        /* Full A4 letterhead — fixed so it repeats on every printed page */
        .letterhead-bg {
            position: fixed;
            top: 0;
            left: 0;
            width: 210mm;
            height: 297mm;
            ${useLetterhead ? `
            background-image: url('${letterheadDataUrl}');
            background-repeat: no-repeat;
            background-position: top center;
            background-size: 100% auto;
            ` : 'background: #fff;'}
            z-index: 0;
            pointer-events: none;
        }
        .report-body {
            position: relative;
            z-index: 1;
            width: 210mm;
            min-height: 297mm;
            padding: ${contentPad};
        }
        /* Fallback header when no letterhead image */
        .header-fallback {
            display: ${useLetterhead ? 'none' : 'flex'};
            justify-content: space-between;
            border-bottom: 3px solid #0d1b3e;
            padding-bottom: 10px;
            margin-bottom: 14px;
        }
        .brand-title { margin: 0; font-size: 24px; font-weight: 900; }
        .brand-title .red { color: #d32f2f; }
        .brand-title .blue { color: #0d1b3e; }
        .patient-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4px 16px;
            padding-bottom: 10px;
            margin-bottom: 10px;
            border-bottom: 1px solid #d1d5db;
        }
        .patient-grid .item label {
            display: block;
            font-size: 7.5px;
            color: #64748b;
            text-transform: uppercase;
            font-weight: 700;
            letter-spacing: 0.3px;
        }
        .patient-grid .item span { font-weight: 600; font-size: 10.5px; }
        .barcode-wrap img { max-height: 36px; }
        .section { margin-bottom: 12px; page-break-inside: avoid; }
        .section-title {
            font-size: 11px;
            font-weight: 900;
            color: #0d1b3e;
            text-transform: uppercase;
            border-bottom: 2px solid #d32f2f;
            padding-bottom: 3px;
            margin: 0 0 6px;
        }
        .section-title .cat { font-size: 9px; font-weight: 400; text-transform: none; color: #64748b; }
        table.results { width: 100%; border-collapse: collapse; }
        table.results th, table.results td {
            border: 1px solid #94a3b8;
            padding: 3px 5px;
            text-align: left;
            font-size: 9.5px;
        }
        table.results th { background: #0d1b3e; color: #fff; font-size: 8.5px; }
        table.results td.result { font-weight: 700; }
        table.results td.flag.high { color: #d32f2f; font-weight: 700; }
        table.results td.flag.low { color: #2563eb; font-weight: 700; }
        .interpretation {
            margin-top: 6px;
            padding: 6px 8px;
            font-size: 9.5px;
            border-left: 3px solid #d32f2f;
            background: rgba(255,247,237,0.85);
        }
        /* QR bottom-left — signature stays on letterhead image (bottom-right) */
        .bottom-meta {
            margin-top: 14px;
            max-width: 55%;
            page-break-inside: avoid;
        }
        .qr img { width: 62px; height: 62px; display: block; }
        .qr small { font-size: 7px; color: #64748b; display: block; margin-top: 2px; }
        .printed { font-size: 7px; color: #94a3b8; margin-top: 4px; }
        .footer-fallback {
            display: ${useLetterhead ? 'none' : 'block'};
            margin-top: 20px;
            background: #0d1b3e;
            color: #fff;
            padding: 8px 12px;
            font-size: 9px;
            font-weight: 700;
        }
    </style>
</head>
<body>
    <div class="letterhead-bg" aria-hidden="true"></div>
    <div class="report-body">
        <div class="header-fallback">
            <div>
                <h1 class="brand-title"><span class="red">${lab.namePart1}</span> <span class="blue">${lab.namePart2}</span></h1>
                <div>${lab.tagline}</div>
                <div>Email - ${lab.email}</div>
            </div>
            <div style="text-align:right">
                <strong>${lab.ownerName}</strong><br/>${lab.phone}
            </div>
        </div>

        <div class="patient-grid">
            <div class="item"><label>Patient Name</label><span>${patient?.name || '—'}</span></div>
            <div class="item"><label>Age / Gender</label><span>${ageGender}</span></div>
            <div class="item"><label>Patient ID</label><span>${patient?.patientNo || '—'}</span></div>
            <div class="item"><label>Bill No</label><span>${report.bill?.billNo || '—'}</span></div>
            <div class="item"><label>Report No</label><span>${report.reportNo}</span></div>
            <div class="item"><label>Sample ID</label><span>${primarySample?.sampleNo || '—'}</span></div>
            <div class="item"><label>Referred Doctor</label><span>${report.bill?.referredDoctor || '—'}</span></div>
            <div class="item barcode-wrap">
                <label>Barcode</label>
                ${barcodeDataUrl ? `<img src="${barcodeDataUrl}" alt="barcode" />` : `<span>${primarySample?.barcode || '—'}</span>`}
            </div>
            <div class="item"><label>Sample Collection Date</label><span>${formatDate(primarySample?.collectedAt)}</span></div>
            <div class="item"><label>Report Date</label><span>${formatDate(report.approvedAt || report.preparedAt || report.createdAt)}</span></div>
        </div>

        ${groupHtml}

        <div class="bottom-meta">
            <div class="qr">
                <img src="${qrDataUrl}" alt="Verify" />
                <small>Scan to verify report authenticity</small>
            </div>
            <div class="printed">Printed: ${formatDateTime(new Date())}</div>
        </div>

        <div class="footer-fallback">ADD. - ${lab.address}</div>
    </div>
</body>
</html>`;
}

export async function generateReportPdf(report, samples = []) {
    if (!fs.existsSync(REPORTS_DIR)) {
        fs.mkdirSync(REPORTS_DIR, { recursive: true });
    }

    const html = await buildReportHtml(report, samples);
    const fileName = `${report.reportNo.replace(/[^a-zA-Z0-9-_]/g, '_')}.pdf`;
    const filePath = path.join(REPORTS_DIR, fileName);

    const { puppeteer } = await loadPdfDeps();
    const browser = await launchPuppeteer(puppeteer);

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });
        await page.setContent(html, { waitUntil: 'networkidle0' });
        await page.pdf({
            path: filePath,
            format: 'A4',
            printBackground: true,
            preferCSSPageSize: true,
            margin: { top: '0', bottom: '0', left: '0', right: '0' },
        });
    } finally {
        await browser.close();
    }

    return `/reports/${fileName}`;
}

export { labConfig, REPORTS_DIR };
