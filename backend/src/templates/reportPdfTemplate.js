import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { launchPuppeteer } from '../utils/puppeteerLaunch.js';
import { resolveResultFlag } from '../utils/flagDetector.js';
import { sortRowsByPanelSequence, resolvePanelKey } from '../constants/panelSequences.js';
import {
    WIDAL_DILUTIONS,
    buildWidalAntigenRows,
    buildWidalNote,
    computeWidalOverall,
    normalizeReaction,
} from '../constants/widalFormat.js';
import { getTyagiReportStyles } from './tyagiReportStyles.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = path.join(__dirname, '../../public/reports');

let pdfDepsPromise = null;
const assetDataUrlCache = new Map();

async function loadPdfDeps() {
    if (!pdfDepsPromise) {
        pdfDepsPromise = Promise.all([
            import('bwip-js'),
            import('qrcode'),
            import('puppeteer'),
        ]).then(([bwipjs, QRCode, puppeteer]) => ({
            bwipjs: bwipjs.default || bwipjs,
            QRCode: QRCode.default || QRCode,
            puppeteer: puppeteer.default || puppeteer,
        }));
    }
    return pdfDepsPromise;
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
        pathologistName: process.env.LAB_PATHOLOGIST_NAME || '',
        pathologistTitle: process.env.LAB_PATHOLOGIST_TITLE || 'MD, Pathologist',
        website: process.env.LAB_WEBSITE || '',
        appUrl: process.env.APP_URL || 'http://localhost:5000',
        letterheadFile: process.env.LAB_LETTERHEAD_FILE || 'Tyagi_Pathology_Letterhead_A4_Final.pdf',
        logoFile: process.env.LAB_LOGO_FILE || 'tyagi-microscope-logo.png',
        logoLayout: (process.env.LAB_LOGO_LAYOUT || 'inline').toLowerCase(),
        letterheadPadding: process.env.LAB_LETTERHEAD_PADDING || '108px 38px 118px 38px',
        reportTemplate: (process.env.LAB_REPORT_TEMPLATE || 'tyagi').toLowerCase(),
        useLetterhead: process.env.LAB_USE_LETTERHEAD === 'true',
    };
}

const LETTERHEAD_CACHE_DIR = path.join(__dirname, '../../public/assets/.cache');

function formatAddressHtml(addr) {
    const lines = String(addr || '')
        .split('|')
        .map((s) => s.trim())
        .filter(Boolean);
    if (lines.length <= 1) return escapeHtml(addr || '');
    return lines.map(escapeHtml).join('<br>');
}

function resolveLetterheadPath(filename) {
    const assetPath = path.join(__dirname, '../../public/assets', filename);
    if (fs.existsSync(assetPath)) return assetPath;
    const rootPath = path.join(__dirname, '../../../', filename);
    if (fs.existsSync(rootPath)) return rootPath;
    return assetPath;
}

async function rasterizePdfLetterhead(pdfPath) {
    if (!fs.existsSync(LETTERHEAD_CACHE_DIR)) {
        fs.mkdirSync(LETTERHEAD_CACHE_DIR, { recursive: true });
    }

    const cachePath = path.join(LETTERHEAD_CACHE_DIR, `${path.basename(pdfPath, '.pdf')}.png`);
    const pdfMtime = fs.statSync(pdfPath).mtimeMs;
    if (fs.existsSync(cachePath) && fs.statSync(cachePath).mtimeMs >= pdfMtime) {
        return cachePath;
    }

    const { puppeteer } = await loadPdfDeps();
    const browser = await launchPuppeteer(puppeteer);

    let page;
    try {
        page = await browser.newPage();
        await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
        await page.goto(pathToFileURL(pdfPath).href, { waitUntil: 'load', timeout: 30000 });
        const png = await page.screenshot({
            type: 'png',
            clip: { x: 0, y: 0, width: 794, height: 1123 },
        });
        fs.writeFileSync(cachePath, png);
        return cachePath;
    } finally {
        if (page) await page.close().catch(() => {});
    }
}

async function loadAssetDataUrl(filename) {
    const assetPath = resolveLetterheadPath(filename);
    if (!fs.existsSync(assetPath)) return '';

    const ext = path.extname(filename).toLowerCase();
    const sourceMtime = fs.statSync(assetPath).mtimeMs;
    let imagePath = assetPath;
    let cacheMtime = sourceMtime;

    if (ext === '.pdf') {
        imagePath = await rasterizePdfLetterhead(assetPath);
        cacheMtime = fs.statSync(imagePath).mtimeMs;
    }

    const cacheKey = `${imagePath}:${cacheMtime}`;
    if (assetDataUrlCache.has(cacheKey)) {
        return assetDataUrlCache.get(cacheKey);
    }

    const mime = ext === '.jpg' || ext === '.jpeg'
        ? 'image/jpeg'
        : 'image/png';
    const dataUrl = `data:${mime};base64,${fs.readFileSync(imagePath).toString('base64')}`;
    assetDataUrlCache.set(cacheKey, dataUrl);
    return dataUrl;
}

async function loadLetterheadDataUrl(filename) {
    return loadAssetDataUrl(filename);
}

function formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(d) {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-IN');
}

function formatDateTimeShort(d) {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

function escapeHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function flagDisplay(flag) {
    if (!flag || flag === 'Normal') return { text: 'Normal', cls: 'normal' };
    if (flag === 'High') return { text: 'High', cls: 'high' };
    if (flag === 'Low') return { text: 'Low', cls: 'low' };
    return { text: flag, cls: '' };
}

function tyagiResultClass(flag) {
    const fd = flagDisplay(flag);
    if (fd.cls === 'high') return 'abnormal-high';
    if (fd.cls === 'low') return 'abnormal-low';
    if (fd.cls === 'normal') return 'normal';
    return '';
}

function tyagiRowFlag(row, gender) {
    return resolveResultFlag(row.resultValue, {
        referenceRange: row.referenceRange,
        gender,
    });
}

function formatTyagiResult(value, flag) {
    const base = String(value ?? '').trim();
    if (!base) return '';
    if (flag === 'High') return `${base} H`;
    if (flag === 'Low') return `${base} L`;
    return base;
}

/** Group & sort report rows for PDF — preserves lab test / parameter sequence. */
function groupReportTestsForPdf(reportTests) {
    const sorted = [...(reportTests || [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    const groups = [];

    for (const rt of sorted) {
        const labTest = rt.labTest;
        const reportType = labTest?.reportType || 'single';

        if (reportType === 'grouped' && rt.labTestId) {
            let group = groups.find((g) => (g.layout === 'grouped' || g.layout === 'widal') && g.labTestId === rt.labTestId);
            if (!group) {
                const panelKey = resolvePanelKey(labTest?.code) || resolvePanelKey(labTest?.category?.code);
                group = {
                    layout: panelKey === 'WIDAL' ? 'widal' : 'grouped',
                    labTestId: rt.labTestId,
                    heading: labTest?.name || rt.testName,
                    code: labTest?.code || '',
                    categoryName: labTest?.category?.name || '',
                    categoryCode: labTest?.category?.code || '',
                    sampleType: labTest?.sampleType || '',
                    rows: [],
                    interpretation: '',
                    minSortOrder: rt.sortOrder ?? 0,
                };
                groups.push(group);
            }
            group.rows.push(rt);
            if (rt.remarks) group.interpretation = rt.remarks;
            continue;
        }

        const categoryKey = labTest?.category?.id || labTest?.category?.name || 'general';
        let group = groups.find((g) => g.layout === 'category' && g.categoryKey === categoryKey);
        if (!group) {
            group = {
                layout: 'category',
                categoryKey,
                heading: labTest?.category?.name || 'General Tests',
                code: labTest?.category?.code || '',
                sampleType: labTest?.sampleType || '',
                rows: [],
                interpretation: '',
                minSortOrder: rt.sortOrder ?? 0,
            };
            groups.push(group);
        }
        group.rows.push(rt);
        if (rt.remarks) group.interpretation = rt.remarks;
        if (!group.sampleType && labTest?.sampleType) group.sampleType = labTest.sampleType;
    }

    for (const group of groups) {
        group.rows.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        const panelKey = resolvePanelKey(group.code) || resolvePanelKey(group.categoryCode);
        if (panelKey) {
            group.rows = sortRowsByPanelSequence(group.rows, panelKey);
        }
    }

    groups.sort((a, b) => a.minSortOrder - b.minSortOrder);
    return groups;
}

function renderGroupedTableRows(rows) {
    return rows.map((r) => {
        const fd = flagDisplay(r.flag);
        const abnormal = fd.cls !== 'normal';
        const resultCls = abnormal ? `result-val ${fd.cls}` : 'result-val normal';
        return `
            <tr class="data-row">
                <td class="test-name">${escapeHtml(r.testName)}</td>
                <td class="${resultCls}">${escapeHtml(r.resultValue || '—')}</td>
                <td class="ref-val">${escapeHtml(r.referenceRange || '—')}</td>
                <td class="unit-val">${escapeHtml(r.unit || '—')}</td>
            </tr>`;
    }).join('');
}

function renderDrlogyTableRows(rows) {
    return rows.map((r) => {
        const fd = flagDisplay(r.flag);
        const resultCls = fd.cls === 'normal' ? 'result-val normal' : `result-val ${fd.cls}`;
        return `
            <tr class="data-row">
                <td class="investigation">
                    <strong>${escapeHtml(r.testName)}</strong>
                    ${r.method ? `<div class="method">${escapeHtml(r.method)}</div>` : ''}
                </td>
                <td class="${resultCls}">${escapeHtml(r.resultValue || '—')}</td>
                <td class="status-cell ${fd.cls}">${escapeHtml(fd.text)}</td>
                <td class="ref-val">${escapeHtml(r.referenceRange || '—')}</td>
                <td class="unit-val">${escapeHtml(r.unit || '—')}</td>
            </tr>`;
    }).join('');
}

function renderTyagiTableRows(rows, gender) {
    return rows.map((r) => {
        const flag = tyagiRowFlag(r, gender);
        const resultCls = tyagiResultClass(flag);
        const rowCls = flag === 'High' || flag === 'Low' ? 'row-abnormal' : '';
        const resultClsAttr = resultCls ? ` class="${resultCls}"` : '';
        const rowClsAttr = rowCls ? ` class="${rowCls}"` : '';
        const displayResult = formatTyagiResult(r.resultValue, flag);
        return `
            <tr${rowClsAttr}>
                <td>${escapeHtml(r.testName)}</td>
                <td${resultClsAttr}>${escapeHtml(displayResult)}</td>
                <td>${escapeHtml(r.referenceRange || '—')}</td>
                <td>${escapeHtml(r.unit || '—')}</td>
            </tr>`;
    }).join('');
}

function renderTyagiPanelTitle(group) {
    let heading = (group.heading || 'Report').trim();
    const code = (group.code || '').trim();

    if (/report$/i.test(heading)) return heading;

    if (code) {
        const codePattern = new RegExp(`\\(${code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'i');
        if (!codePattern.test(heading)) {
            heading = `${heading} (${code})`;
        }
    }

    return `${heading} Report`;
}

function isFbsPanel(group) {
    const heading = String(group?.heading || '').toLowerCase();
    const code = String(group?.code || '').toLowerCase();
    const hasFbsInHeading = heading.includes('fasting blood sugar') || heading.includes('fasting glucose') || heading.includes('fbs');
    const hasFbsInCode = code === 'fbs' || code.includes('fbs');
    return hasFbsInHeading || hasFbsInCode;
}

function isCbcPanel(group) {
    const panelKey = resolvePanelKey(group?.code) || resolvePanelKey(group?.categoryCode);
    if (panelKey === 'CBC') return true;
    const heading = String(group?.heading || '').toLowerCase();
    const code = String(group?.code || '').toLowerCase();
    return code === 'cbc'
        || heading.includes('complete blood count')
        || /\bcbc\b/.test(heading);
}

function renderFbsReferenceTable() {
    return `
        <div class="fbs-reference">
            <table class="fbs-ref-table">
                <thead>
                    <tr>
                        <th>Fasting Glucose</th>
                        <th>2 hours PP Glucose</th>
                        <th>Diagnosis</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>&lt;100</td>
                        <td>&lt;140</td>
                        <td>Normal</td>
                    </tr>
                    <tr>
                        <td>100 to 125</td>
                        <td>140 to 199</td>
                        <td>Pre Diabetes</td>
                    </tr>
                    <tr>
                        <td>&gt;126</td>
                        <td>&gt;200</td>
                        <td>Diabetes</td>
                    </tr>
                </tbody>
            </table>
        </div>`;
}

function renderWidalTestSection(group) {
    const antigenRows = buildWidalAntigenRows(group.rows);
    const overall = computeWidalOverall(antigenRows);
    const note = buildWidalNote(antigenRows);
    const overallCls = overall === 'POSITIVE' ? 'widal-overall positive' : 'widal-overall';

    const gridRows = antigenRows.map((row) => `
        <tr>
            <td class="widal-antigen">${escapeHtml(row.testName)}</td>
            ${WIDAL_DILUTIONS.map((d) => `
                <td class="widal-cell">${escapeHtml(normalizeReaction(row.dilutions[d]) || '—')}</td>
            `).join('')}
        </tr>`).join('');

    return `
        <div class="panel-section widal-section">
            <div class="widal-title">** REPORT ON THE WIDAL TEST</div>
            <div class="report-table-wrap">
                <table class="report widal-summary">
                    <thead>
                        <tr>
                            <th>Investigation</th>
                            <th>Result</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>WIDAL TEST</td>
                            <td class="${overallCls}">${escapeHtml(overall)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="report-table-wrap">
                <table class="report widal-grid">
                    <thead>
                        <tr>
                            <th class="widal-antigen-col">Investigation</th>
                            ${WIDAL_DILUTIONS.map((d) => `<th>${escapeHtml(d)}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${gridRows}
                    </tbody>
                </table>
            </div>
            ${note ? `<div class="widal-note">${escapeHtml(note)}</div>` : ''}
            <div class="widal-end">******* END OF REPORT *******</div>
        </div>`;
}

function renderTyagiTestSection(group, gender, { cbcAlone = false } = {}) {
    if (group.layout === 'widal') return renderWidalTestSection(group);
    const title = renderTyagiPanelTitle(group);
    const isCbc = isCbcPanel(group);
    const sectionClass = [
        'panel-section',
        isCbc ? 'panel-section--cbc' : '',
        cbcAlone ? 'panel-section--cbc-alone' : '',
    ].filter(Boolean).join(' ');
    return `
        <div class="${sectionClass}">
            <div class="report-title">
                <h2>${escapeHtml(title)}</h2>
            </div>
            <div class="report-table-wrap">
                <table class="report ${isCbc ? 'report--cbc' : ''}">
                    <thead>
                        <tr>
                            <th style="width:30%">Investigation</th>
                            <th style="width:20%">Result</th>
                            <th style="width:35%">Reference Value</th>
                            <th style="width:15%">Unit</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${renderTyagiTableRows(group.rows, gender)}
                    </tbody>
                </table>
            </div>
            ${isFbsPanel(group) ? renderFbsReferenceTable() : ''}
            ${group.interpretation ? `
                <div class="advice-box">
                    <div class="advice-title">Interpretation</div>
                    <div class="advice-body">${escapeHtml(group.interpretation)}</div>
                </div>
            ` : ''}
        </div>`;
}

function renderTestSection(group, reportNo) {
    if (group.layout === 'widal') return renderWidalTestSection(group);
    const isGrouped = group.layout === 'grouped';
    const title = group.code
        ? `${group.heading.toUpperCase()} (${group.code})`
        : group.heading.toUpperCase();
    const categoryLine = isGrouped && group.categoryName
        ? `<div class="category-subtitle">${escapeHtml(group.categoryName.toUpperCase())}</div>`
        : '';

    const tableHead = isGrouped
        ? `<tr class="header-row">
                <th>Test Description</th>
                <th>Result</th>
                <th>Ref. Range</th>
                <th>Unit</th>
           </tr>`
        : `<tr class="header-row">
                <th>Investigation</th>
                <th>Result</th>
                <th></th>
                <th>Reference Value</th>
                <th>Unit</th>
           </tr>`;

    const metaColspan = isGrouped ? 2 : 2;
    const metaColspanRight = isGrouped ? 2 : 3;
    const rows = isGrouped ? renderGroupedTableRows(group.rows) : renderDrlogyTableRows(group.rows);

    return `
        <div class="test-section ${isGrouped ? 'layout-grouped' : 'layout-category'}">
            ${categoryLine}
            <h2 class="category-title">${escapeHtml(title)}${isGrouped ? ' REPORT' : ''}</h2>
            <table class="results-table ${isGrouped ? 'table-grouped' : 'table-drlogy'}">
                <thead>${tableHead}</thead>
                <tbody>
                    <tr class="meta-row">
                        <td colspan="${metaColspan}"><span class="meta-lbl">Sample Type</span> ${escapeHtml(group.sampleType || '—')}</td>
                        <td colspan="${metaColspanRight}" class="meta-right"><span class="meta-lbl">Report No</span> ${escapeHtml(reportNo)}</td>
                    </tr>
                    ${rows}
                </tbody>
            </table>
            ${group.interpretation ? `
                <div class="interpretation-box">
                    <div class="interpretation-title">Interpretation:</div>
                    <p>${escapeHtml(group.interpretation)}</p>
                </div>
            ` : ''}
        </div>`;
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
    return groupReportTestsForPdf(reportTests);
}

function isPortraitLogo(filename) {
    return /microscope|stacked/i.test(filename || '');
}

async function buildTyagiReportHtml(report, samples = []) {
    const lab = labConfig();
    const [whatsappIconDataUrl, logoDataUrl] = await Promise.all([
        loadAssetDataUrl('whatsapp.png'),
        loadAssetDataUrl(lab.logoFile),
    ]);

    const patient = report.patient;
    const ageText = patient?.age != null ? String(patient.age) : '';
    const sexText = patient?.gender || '';
    const ageSexText = [ageText, sexText].filter(Boolean).join(' / ');
    const groups = groupReportTests(report.reportTests || []);
    const reportedAt = report.approvedAt || report.preparedAt || report.createdAt;
    const patientGender = patient?.gender || '';
    const hasCbc = groups.some((group) => isCbcPanel(group));
    const orderedGroups = hasCbc
        ? [
            ...groups.filter((group) => isCbcPanel(group)),
            ...groups.filter((group) => !isCbcPanel(group)),
        ]
        : groups;
    const nonCbcCount = orderedGroups.filter((group) => !isCbcPanel(group)).length;
    const groupsHtml = orderedGroups.map((group) => {
        const isCbc = isCbcPanel(group);
        return renderTyagiTestSection(group, patientGender, {
            cbcAlone: isCbc && nonCbcCount > 0,
        });
    }).join('');
    const reportRemarks = report.remarks || '';
    const portraitLogo = isPortraitLogo(lab.logoFile);
    const stackedLogo = portraitLogo && lab.logoLayout === 'stacked';
    const logoClass = portraitLogo
        ? (stackedLogo ? 'lab-logo--stacked' : 'lab-logo--portrait')
        : '';
    const logoHtml = logoDataUrl
        ? `<img class="lab-logo ${logoClass}" src="${logoDataUrl}" alt="${escapeHtml(lab.name)}" />`
        : '';
    const brandHtml = `
                    <div class="brand-name">
                        <h1><span class="brand-tyagi">${escapeHtml(lab.namePart1)}</span> <span class="brand-pathology">${escapeHtml(lab.namePart2)}</span></h1>
                        <div class="tagline">${escapeHtml(lab.tagline)}</div>
                    </div>`;
    const contactHtml = `
            <div class="header-right">
                <div class="contact-box">
                    <div class="owner-name">${escapeHtml(lab.ownerName)}</div>
                    <div class="phone">
                        ${whatsappIconDataUrl ? `<img class="whatsapp-icon" src="${whatsappIconDataUrl}" alt="" />` : ''}
                        ${escapeHtml(lab.phone)}
                    </div>
                </div>
            </div>`;
    const headerTopHtml = stackedLogo
        ? `<div class="header-top header-top--centered">
            <div class="header-brand header-brand--stacked">
                ${logoHtml}
                ${brandHtml}
            </div>
            ${contactHtml}
        </div>`
        : `<div class="header-top">
            <div class="header-brand ${portraitLogo ? 'header-brand--portrait' : ''}">
                ${logoHtml}
                ${brandHtml}
            </div>
            ${contactHtml}
        </div>`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(lab.name)} - Lab Report ${escapeHtml(report.reportNo)}</title>
    <style>${getTyagiReportStyles()}</style>
</head>
<body>
<table class="print-layout">
<thead>
<tr><td>
<div class="page-header">
    <div class="header">
        ${headerTopHtml}
        <div class="email-row">
            <span class="email-icon"></span>
            <span>Email</span> &nbsp;–&nbsp; <span class="email-value">${escapeHtml(lab.email)}</span>
        </div>
    </div>
</div>
</td></tr>
</thead>
<tbody>
<tr><td>
<div class="page">
    <div class="watermark">${escapeHtml(lab.name)}</div>

    <div class="page-content">
        <div class="patient-section">
            <div class="patient-grid">
                <div class="patient-col">
                    <div class="field">
                        <span class="label">Patient Name</span>
                        <span class="value">${escapeHtml(patient?.name || '')}</span>
                    </div>
                    <div class="field">
                        <span class="label">Ref.Doctor</span>
                        <span class="value">${escapeHtml(report.bill?.referredDoctor || '')}</span>
                    </div>
                </div>
                <div class="patient-col">
                    <div class="field">
                        <span class="label">Age / Sex</span>
                        <span class="value">${escapeHtml(ageSexText)}</span>
                    </div>
                    <div class="field">
                        <span class="label">Date</span>
                        <span class="value">${formatDate(reportedAt)}</span>
                    </div>
                </div>
            </div>
        </div>

        ${groupsHtml}

        <div class="report-closing">

        ${reportRemarks ? `
            <div class="advice-box">
                <div class="advice-title">Advice</div>
                <div class="advice-body">${escapeHtml(reportRemarks)}</div>
            </div>
        ` : ''}

        <div class="sig-row">
            <div class="sig-block">
                <div class="sig-role">${escapeHtml(lab.signatureTitle)}</div>
                <div class="sig-line"></div>
            </div>
        </div>
        </div>
    </div>
</div>
</td></tr>
</tbody>
</table>

<div class="page-footer">
    <div class="legal-disclaimer">THIS REPORT IS NOT VALID FOR MEDICO - LEGAL PURPOSE</div>
    <div class="footer">
        <div class="addr-block">
            <div class="pin-icon">📍</div>
            <div class="addr-text">
                ADD. – ${formatAddressHtml(lab.address)}
            </div>
        </div>
        <div class="home-collect">
            <span class="icon">🛵</span>
            <span>FREE HOME COLLECTION</span>
        </div>
    </div>
</div>
</body>
</html>`;
}

async function buildDrlogyReportHtml(report, samples = []) {
    const lab = labConfig();
    const letterheadDataUrl = lab.useLetterhead
        ? await loadLetterheadDataUrl(lab.letterheadFile)
        : '';
    const verifyUrl = `${lab.appUrl}/report/verify/${report.reportNo}`;
    const qrDataUrl = await toQrDataUrl(verifyUrl);
    const primarySample = samples[0];
    const barcodeDataUrl = primarySample?.barcode ? await toBarcodeDataUrl(primarySample.barcode) : '';
    const collectedByName = primarySample?.collectedBy?.name || '—';
    const sampleCollectedAt = lab.address;

    const patient = report.patient;
    const ageText = patient?.age ? `${patient.age} Years` : '—';
    const sexText = patient?.gender || '—';
    const groups = groupReportTests(report.reportTests || []);
    const reportedAt = report.approvedAt || report.preparedAt || report.createdAt;
    const registeredAt = report.bill?.createdAt || report.createdAt;

    const groupHtml = groups.map((group) => renderTestSection(group, report.reportNo)).join('');

    const useLetterhead = Boolean(letterheadDataUrl);

    const contentPad = useLetterhead
        ? lab.letterheadPadding
        : '16px 20px 20px';

    const reportRemarks = report.remarks || '';
    const signatureBlock = `
        <div class="signatures ${useLetterhead ? 'on-letterhead' : ''}">
            <div class="sig-block">
                <div class="sig-line"></div>
                <div class="sig-name">${escapeHtml(lab.signatureName)}</div>
                <div class="sig-title">Medical Lab Technician</div>
                <div class="sig-sub">${escapeHtml(lab.signatureTitle)}</div>
            </div>
            ${lab.pathologistName ? `
            <div class="sig-block">
                <div class="sig-line"></div>
                <div class="sig-name">${escapeHtml(lab.pathologistName)}</div>
                <div class="sig-title">${escapeHtml(lab.pathologistTitle)}</div>
            </div>` : ''}
        </div>`;

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <title>Report ${escapeHtml(report.reportNo)}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=swap');
        @page { size: A4 portrait; margin: 0; }
        * { box-sizing: border-box; }
        html, body {
            margin: 0; padding: 0;
            width: 210mm;
            font-family: 'Roboto', Arial, Helvetica, sans-serif;
            font-size: 10px;
            color: #263238;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        .letterhead-bg {
            position: fixed; top: 0; left: 0;
            width: 210mm; height: 297mm;
            ${useLetterhead ? `
            background-image: url('${letterheadDataUrl}');
            background-repeat: no-repeat;
            background-position: top center;
            background-size: 100% auto;
            ` : 'background: #fff;'}
            z-index: 0; pointer-events: none;
        }
        .report-body {
            position: relative; z-index: 1;
            width: 210mm; min-height: 297mm;
            padding: ${contentPad};
        }

        /* ── Drlogy-style header (fallback when no letterhead) ── */
        .drlogy-header { display: ${useLetterhead ? 'none' : 'block'}; margin-bottom: 8px; }
        .drlogy-header-top {
            display: flex; justify-content: space-between; align-items: flex-start;
            padding-bottom: 6px;
        }
        .drlogy-brand { display: flex; gap: 10px; align-items: center; }
        .drlogy-logo {
            width: 52px; height: 52px; border-radius: 50%;
            background: #1565c0; color: #fff;
            display: flex; align-items: center; justify-content: center;
            font-size: 22px; font-weight: 900;
        }
        .drlogy-name { font-size: 20px; font-weight: 900; color: #1565c0; margin: 0; line-height: 1.1; }
        .drlogy-tagline { font-size: 8.5px; color: #546e7a; margin-top: 2px; }
        .drlogy-contact { text-align: right; font-size: 8.5px; line-height: 1.5; }
        .drlogy-address {
            font-size: 8px; color: #37474f; text-align: center;
            padding: 4px 0; border-top: 1px solid #cfd8dc;
        }
        .drlogy-stripe {
            background: #1565c0; color: #fff;
            padding: 3px 8px; font-size: 8px;
            display: flex; justify-content: flex-end;
        }

        /* ── Patient info block (Drlogy 3-column) ── */
        .patient-panel {
            display: grid;
            grid-template-columns: 1.15fr 1fr 0.95fr;
            border: 1px solid #90a4ae;
            margin-bottom: 10px;
            background: rgba(255,255,255,0.95);
        }
        .patient-panel > div { padding: 7px 9px; }
        .patient-panel > div + div { border-left: 1px solid #b0bec5; }
        .patient-left-wrap { display: flex; gap: 8px; align-items: flex-start; }
        .patient-details { flex: 1; }
        .p-row { display: flex; margin-bottom: 2px; line-height: 1.4; font-size: 9px; }
        .p-row .lbl { color: #546e7a; min-width: 30px; }
        .p-row .val { font-weight: 500; }
        .p-row .val.bold { font-weight: 700; font-size: 10px; }
        .patient-qr img { width: 68px; height: 68px; display: block; }
        .patient-mid .p-row .lbl { min-width: 108px; }
        .patient-mid .p-row .val.bold { font-weight: 700; }
        .patient-right { text-align: right; }
        .patient-right .barcode-img {
            max-height: 36px; display: block; margin: 0 0 5px auto;
        }
        .time-row { font-size: 8px; margin-bottom: 2px; color: #37474f; }
        .time-row strong { color: #1565c0; }

        /* ── Category + results table ── */
        .test-section { margin-bottom: 12px; page-break-inside: auto; break-inside: auto; }
        .category-subtitle {
            text-align: center; font-size: 9px; font-weight: 700;
            color: #546e7a; text-transform: uppercase; letter-spacing: 0.6px;
            margin-bottom: 2px;
        }
        .category-title {
            text-align: center; font-size: 11px; font-weight: 900;
            color: #263238; text-transform: uppercase;
            letter-spacing: 0.5px; margin: 0 0 0; padding: 5px 0;
            border-bottom: 2px solid #1565c0;
        }
        .results-table { width: 100%; border-collapse: collapse; }
        .results-table .header-row th {
            background: #b0bec5; color: #263238;
            font-size: 8.5px; font-weight: 700;
            padding: 4px 7px; text-align: left;
            border: 1px solid #90a4ae;
        }
        .table-grouped .header-row th:nth-child(2),
        .table-grouped .header-row th:nth-child(3),
        .table-grouped .header-row th:nth-child(4),
        .table-grouped td:nth-child(2),
        .table-grouped td:nth-child(3),
        .table-grouped td:nth-child(4) { text-align: center; }
        .table-drlogy .header-row th:nth-child(2),
        .table-drlogy .header-row th:nth-child(3),
        .table-drlogy .header-row th:nth-child(4),
        .table-drlogy .header-row th:nth-child(5),
        .table-drlogy td:nth-child(2),
        .table-drlogy td:nth-child(3),
        .table-drlogy td:nth-child(4),
        .table-drlogy td:nth-child(5) { text-align: center; }
        .results-table td {
            border: 1px solid #cfd8dc;
            padding: 4px 7px; font-size: 9px; vertical-align: middle;
        }
        .results-table .meta-row td {
            background: #fafafa; font-size: 8px; padding: 3px 7px;
        }
        .meta-lbl { font-weight: 700; color: #546e7a; margin-right: 4px; }
        .meta-right { text-align: right !important; }
        .test-name { font-weight: 600; font-size: 9.5px; }
        .layout-grouped .data-row:nth-child(even) td { background: #fafafa; }
        .investigation strong { font-size: 9.5px; font-weight: 700; }
        .investigation .method { font-size: 7.5px; font-style: italic; color: #78909c; margin-top: 1px; }
        .result-val { font-weight: 700; text-align: center; font-size: 10px; }
        .result-val.normal { color: #2e7d32; }
        .result-val.high { color: #c62828; font-weight: 900; }
        .result-val.low { color: #1565c0; font-weight: 900; }
        .layout-grouped .result-val.high,
        .layout-grouped .result-val.low { font-weight: 900; }
        .status-cell { text-align: center; font-weight: 600; font-size: 8.5px; }
        .status-cell.normal { color: #2e7d32; }
        .status-cell.high { color: #c62828; }
        .status-cell.low { color: #1565c0; }
        .ref-val, .unit-val { text-align: center; }

        /* ── Interpretation / Advice ── */
        .interpretation-box, .advice-box {
            margin-top: 8px; padding: 7px 9px;
            border: 1px solid #cfd8dc; background: #fafafa;
            font-size: 8.5px; line-height: 1.45;
        }
        .interpretation-title, .advice-title { font-weight: 900; font-size: 9px; margin-bottom: 3px; color: #1565c0; }

        /* ── Widal test layout ── */
        .widal-section { margin: 10px 0 14px; }
        .widal-title {
            text-align: center;
            font-size: 11px;
            font-weight: 900;
            margin-bottom: 8px;
            text-transform: uppercase;
        }
        .widal-summary { margin-bottom: 6px; width: 100%; border-collapse: collapse; }
        .widal-grid { width: 100%; border-collapse: collapse; }
        .widal-summary th, .widal-summary td,
        .widal-grid th, .widal-grid td {
            border: 1px solid #cfd8dc;
            padding: 4px 6px;
            font-size: 9px;
        }
        .widal-grid th, .widal-grid td { text-align: center; }
        .widal-grid .widal-antigen, .widal-grid .widal-antigen-col { text-align: left; font-weight: 700; }
        .widal-overall { font-weight: 900; text-transform: uppercase; }
        .widal-overall.positive { color: #c62828; }
        .widal-note {
            margin-top: 6px;
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
        }
        .widal-end {
            margin-top: 8px;
            text-align: center;
            font-size: 9px;
            font-weight: 700;
        }

        /* ── End of report + signatures ── */
        .end-marker {
            text-align: center; font-weight: 700; font-size: 9px;
            margin: 14px 0 10px; color: #546e7a;
        }
        .signatures {
            display: flex; justify-content: space-around;
            margin: 10px 0 8px; page-break-inside: avoid;
        }
        .signatures.on-letterhead { margin-top: 6px; }
        .sig-block { text-align: center; min-width: 130px; }
        .sig-line { border-top: 1px solid #90a4ae; margin-bottom: 4px; padding-top: 28px; }
        .signatures.on-letterhead .sig-line { border: none; padding-top: 0; height: 0; margin: 0; }
        .signatures.on-letterhead .sig-block { display: none; }
        .sig-name { font-weight: 700; font-size: 9px; }
        .sig-title { font-size: 8px; color: #546e7a; }
        .sig-sub { font-size: 7.5px; color: #78909c; }

        .auth-note {
            text-align: center; font-size: 7.5px; color: #1565c0;
            font-weight: 600; margin: 6px 0 4px;
        }
        .page-meta {
            display: flex; justify-content: space-between;
            font-size: 7.5px; color: #78909c; margin-bottom: 6px;
        }
        .drlogy-footer {
            display: ${useLetterhead ? 'none' : 'flex'};
            background: #1565c0; color: #fff;
            justify-content: space-between; align-items: center;
            padding: 5px 10px; font-size: 8px; font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="letterhead-bg" aria-hidden="true"></div>
    <div class="report-body">

        <div class="drlogy-header">
            <div class="drlogy-header-top">
                <div class="drlogy-brand">
                    <div class="drlogy-logo">+</div>
                    <div>
                        <h1 class="drlogy-name">${escapeHtml(lab.name)}</h1>
                        <div class="drlogy-tagline">${escapeHtml(lab.tagline)}</div>
                    </div>
                </div>
                <div class="drlogy-contact">
                    <div>${escapeHtml(lab.phone)}</div>
                    <div>${escapeHtml(lab.email)}</div>
                </div>
            </div>
            <div class="drlogy-address">${escapeHtml(lab.address)}</div>
            ${lab.website ? `<div class="drlogy-stripe">${escapeHtml(lab.website)}</div>` : '<div class="drlogy-stripe"></div>'}
        </div>

        <div class="patient-panel">
            <div class="patient-left-wrap">
                <div class="patient-details">
                    <div class="p-row"><span class="lbl">Name</span><span class="val bold">${escapeHtml(patient?.name || '—')}</span></div>
                    <div class="p-row"><span class="lbl">Age</span><span class="val">${escapeHtml(ageText)}</span></div>
                    <div class="p-row"><span class="lbl">Sex</span><span class="val">${escapeHtml(sexText)}</span></div>
                    <div class="p-row"><span class="lbl">UHID</span><span class="val">${escapeHtml(patient?.patientNo || '—')}</span></div>
                </div>
                <div class="patient-qr">
                    <img src="${qrDataUrl}" alt="QR" />
                </div>
            </div>
            <div class="patient-mid">
                <div class="p-row"><span class="lbl">Sample Collected At</span><span class="val">${escapeHtml(sampleCollectedAt)}</span></div>
                <div class="p-row"><span class="lbl">Sample Collected By</span><span class="val">${escapeHtml(collectedByName)}</span></div>
                <div class="p-row"><span class="lbl">Ref. By</span><span class="val bold">${escapeHtml(report.bill?.referredDoctor || '—')}</span></div>
            </div>
            <div class="patient-right">
                ${barcodeDataUrl
                    ? `<img class="barcode-img" src="${barcodeDataUrl}" alt="barcode" />`
                    : ''}
                <div class="time-row"><strong>Registered on:</strong> ${formatDateTimeShort(registeredAt)}</div>
                <div class="time-row"><strong>Collected on:</strong> ${formatDateTimeShort(primarySample?.collectedAt)}</div>
                <div class="time-row"><strong>Reported on:</strong> ${formatDateTimeShort(reportedAt)}</div>
            </div>
        </div>

        ${groupHtml}

        ${reportRemarks ? `
            <div class="advice-box">
                <div class="advice-title">ADVICE</div>
                <p>${escapeHtml(reportRemarks)}</p>
            </div>
        ` : ''}

        <div class="end-marker">****End of Report****</div>

        ${signatureBlock}

        <div class="auth-note">To Check Report Authenticity by Scanning QR Code on Top</div>
        <div class="page-meta">
            <span>Generated on: ${formatDateTimeShort(new Date())}</span>
            <span>Page 1 of 1</span>
        </div>

        <div class="drlogy-footer">
            <span>${escapeHtml(lab.website || lab.name)}</span>
            <span>Sample Collection: ${escapeHtml(lab.phone)}</span>
            <span>WhatsApp: ${escapeHtml(lab.phone)}</span>
        </div>
    </div>
</body>
</html>`;
}

export async function buildReportHtml(report, samples = []) {
    const lab = labConfig();
    if (lab.reportTemplate === 'drlogy') {
        return buildDrlogyReportHtml(report, samples);
    }
    return buildTyagiReportHtml(report, samples);
}

/** Opens browser print with zero @page margins (unlike printing a PDF blob). */
export function wrapReportHtmlForPrint(html) {
    const boot = `<script>
(function () {
    function runPrint() {
        window.focus();
        window.print();
    }
    if (document.readyState === 'complete') {
        setTimeout(runPrint, 350);
    } else {
        window.addEventListener('load', function () { setTimeout(runPrint, 350); });
    }
})();
</script>`;
    return html.replace('</body>', `${boot}</body>`);
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

    let page;
    try {
        page = await browser.newPage();
        await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });
        await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.emulateMediaType('print');
        await page.pdf({
            path: filePath,
            format: 'A4',
            printBackground: true,
            preferCSSPageSize: true,
            margin: { top: '0', bottom: '0', left: '0', right: '0' },
        });
    } finally {
        if (page) await page.close().catch(() => {});
    }

    return `/reports/${fileName}`;
}

export async function warmupPdfAssets() {
    const lab = labConfig();
    const { puppeteer } = await loadPdfDeps();
    const browser = await launchPuppeteer(puppeteer);

    await Promise.all([
        loadAssetDataUrl(lab.logoFile),
        loadAssetDataUrl('whatsapp.png'),
        lab.useLetterhead ? loadAssetDataUrl(lab.letterheadFile) : Promise.resolve(),
        (async () => {
            let page;
            try {
                page = await browser.newPage();
                await page.setContent('<html><body></body></html>', { waitUntil: 'domcontentloaded' });
            } finally {
                if (page) await page.close().catch(() => {});
            }
        })(),
    ]);
}

export { labConfig, REPORTS_DIR };
