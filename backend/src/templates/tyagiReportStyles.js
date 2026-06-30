/** Tyagi Pathology report CSS (A4 print layout). */
export function getTyagiReportStyles() {
    return `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @page { size: A4 portrait; margin: 0; }
        html, body {
            font-family: Arial, Helvetica, sans-serif;
            background: #fff;
            width: 210mm;
            margin: 0 auto;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        .page {
            width: 210mm;
            min-height: 297mm;
            background: #fff;
            margin: 0 auto;
            position: relative;
            padding-bottom: 120px;
        }
        .header {
            display: flex;
            flex-direction: column;
            gap: 8px;
            padding: 12px 30px 10px;
            border-bottom: 3px solid #1a2a5e;
            position: relative;
        }
        .header::after {
            content: '';
            position: absolute;
            bottom: -5px; left: 30px; right: 30px;
            height: 2px;
            background: linear-gradient(to right, #c0392b 35%, transparent);
        }
        .header-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            width: 100%;
        }
        .header-top--centered {
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            align-items: center;
            gap: 12px;
        }
        .header-top--centered .header-brand--stacked {
            grid-column: 2;
            justify-self: center;
        }
        .header-top--centered .header-right {
            grid-column: 3;
            justify-self: end;
        }
        .header-brand {
            display: flex;
            align-items: center;
            gap: 12px;
            flex: 1;
            min-width: 0;
        }
        .header-brand--stacked {
            flex: 0 1 auto;
            flex-direction: column;
            align-items: center;
            gap: 6px;
            text-align: center;
        }
        .lab-logo {
            height: 90px;
            width: auto;
            max-width: 240px;
            object-fit: contain;
            display: block;
            flex-shrink: 0;
        }
        .lab-logo--stacked {
            height: 118px;
            max-width: 220px;
        }
        .lab-logo--portrait {
            height: 105px;
            max-width: 130px;
        }
        .header-brand--portrait {
            flex-direction: row;
            align-items: center;
            gap: 14px;
        }
        .brand-name--centered {
            text-align: center;
        }
        .brand-name {
            padding: 0;
            background: transparent;
            flex: 1;
            min-width: 0;
        }
        .brand-name h1 {
            font-size: 28px;
            font-weight: 900;
            letter-spacing: 0.5px;
            line-height: 1.1;
        }
        .brand-tyagi { color: #1f2f57; }
        .brand-pathology { color: #8b2332; }
        .brand-name .tagline {
            font-size: 8.5px;
            color: #1f2f57;
            font-weight: 700;
            letter-spacing: 1.1px;
            text-transform: uppercase;
            margin-top: 4px;
        }
        .header .email-row {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            font-weight: 700;
            color: #1a2a5e;
        }
        .header .email-row .email-value {
            font-size: 13px;
            font-weight: 800;
        }
        .email-icon {
            width: 18px; height: 12px;
            background: #1a2a5e;
            border-radius: 2px;
            display: inline-block;
            position: relative;
        }
        .email-icon::before {
            content: '';
            position: absolute;
            top: 2px; left: 2px; right: 2px;
            height: 7px;
            border: 1.5px solid #fff;
            border-radius: 1px;
        }
        .header-right {
            text-align: right;
            flex-shrink: 0;
        }
        .contact-box .owner-name {
            font-size: 13px;
            font-weight: 800;
            color: #1a2a5e;
            letter-spacing: 0.5px;
        }
        .contact-box .phone {
            font-size: 13px;
            font-weight: 700;
            color: #1a2a5e;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 4px;
        }
        .whatsapp-icon {
            width: 16px;
            height: 16px;
            display: inline-block;
            object-fit: contain;
            flex-shrink: 0;
        }
        .patient-section {
            padding: 10px 30px 8px;
            background: #f8f9fc;
            border-bottom: 1px solid #ddd;
        }
        .patient-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px 20px;
            font-size: 11.5px;
        }
        .patient-grid .field { display: flex; gap: 6px; }
        .patient-grid .label {
            font-weight: 700;
            color: #1a2a5e;
            min-width: 70px;
        }
        .patient-grid .value {
            color: #222;
            border-bottom: 1px dotted #aaa;
            flex: 1;
            padding-bottom: 1px;
        }
        .report-title {
            text-align: center;
            padding: 10px 30px 4px;
        }
        .category-subtitle {
            text-align: center;
            padding: 12px 30px 0;
            font-size: 12px;
            font-weight: 800;
            color: #1a2a5e;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .report-title h2 {
            font-size: 15px;
            font-weight: 800;
            color: #1a2a5e;
            text-transform: uppercase;
            letter-spacing: 2px;
            border-bottom: 2px solid #c0392b;
            display: inline-block;
            padding-bottom: 3px;
        }
        .report-table-wrap { padding: 8px 30px; }
        table.report {
            width: 100%;
            border-collapse: collapse;
            font-size: 11.5px;
        }
        table.report thead tr { background: #1a2a5e; color: #fff; }
        table.report thead th {
            padding: 6px 10px;
            text-align: left;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        table.report thead th:not(:first-child) {
            border-left: 1px solid rgba(255,255,255,0.2);
        }
        table.report tbody tr { border-bottom: 0.5px solid #e0e0e0; }
        table.report tbody tr:nth-child(even) { background: #f5f7fc; }
        table.report tbody tr.row-abnormal td {
            font-weight: 700;
            color: #111;
        }
        table.report tbody tr.row-abnormal td .method {
            font-weight: 400;
            color: #444;
        }
        table.report tbody td {
            padding: 5px 10px;
            color: #222;
            vertical-align: middle;
        }
        table.report tbody td.method,
        table.report .method {
            font-size: 9px;
            color: #666;
            font-style: italic;
        }
        table.report .normal { color: #222; font-weight: 400; }
        table.report .abnormal-high { color: #111; font-weight: 700; }
        table.report .abnormal-low { color: #111; font-weight: 700; }
        .advice-box {
            margin: 8px 30px;
            padding: 8px 10px;
            border: 1px solid #ddd;
            background: #fafafa;
            font-size: 10.5px;
            line-height: 1.45;
        }
        .advice-box .advice-title {
            font-weight: 800;
            color: #1a2a5e;
            margin-bottom: 4px;
        }
        .sig-row {
            display: flex;
            justify-content: flex-end;
            padding: 18px 36px 6px;
            font-size: 10.5px;
        }
        .sig-block { text-align: center; }
        .sig-block .sig-role {
            color: #555;
            font-size: 9.5px;
            font-weight: 700;
            margin-bottom: 4px;
        }
        .sig-block .sig-line {
            width: 130px;
            border-top: 1.5px solid #333;
            margin: 0 auto;
        }
        .page-footer {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
        }
        .legal-disclaimer {
            text-align: center;
            font-size: 10.5px;
            font-weight: 800;
            letter-spacing: 0.7px;
            color: #333;
            padding: 10px 30px 12px;
            text-transform: uppercase;
            background: #fff;
        }
        .footer {
            background: #1a2a5e;
            color: #fff;
            padding: 14px 30px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 10px;
        }
        .footer .addr-block {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .footer .pin-icon {
            width: 28px; height: 28px;
            background: #c0392b;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            flex-shrink: 0;
        }
        .footer .addr-text {
            font-size: 15px;
            font-weight: 800;
            line-height: 1.4;
            border-left: 2px solid #c0392b;
            padding-left: 10px;
        }
        .footer .home-collect {
            display: flex;
            align-items: center;
            gap: 8px;
            background: #c0392b;
            padding: 5px 12px;
            border-radius: 4px;
        }
        .footer .home-collect .icon { font-size: 18px; }
        .footer .home-collect span {
            font-weight: 700;
            font-size: 10px;
            letter-spacing: 0.5px;
        }
        .watermark {
            position: absolute;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%) rotate(-30deg);
            font-size: 80px;
            font-weight: 900;
            color: rgba(200,200,220,0.12);
            letter-spacing: 4px;
            text-transform: uppercase;
            pointer-events: none;
            white-space: nowrap;
            z-index: 0;
        }
        .page-content { position: relative; z-index: 1; }
        .panel-section { page-break-inside: avoid; }
    `;
}
