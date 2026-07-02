/** Tyagi Pathology report CSS (A4 print layout). */
export function getTyagiReportStyles() {
    return `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @page { size: A4 portrait; margin: 0; }
        html, body {
            font-family: Arial, Helvetica, sans-serif;
            background: #fff;
            width: 100%;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        .print-layout {
            width: 100%;
            margin: 0;
            border-collapse: collapse;
            table-layout: fixed;
        }
        .print-layout thead { display: table-header-group; }
        .print-layout tbody { display: table-row-group; }
        .print-layout td {
            padding: 0;
            vertical-align: top;
        }
        .page {
            width: 100%;
            background: #fff;
            margin: 0;
            position: relative;
        }
        .page-header {
            width: 100%;
            background: #fff;
        }
        .header {
            display: flex;
            flex-direction: column;
            gap: 8px;
            padding: 12px 30px 10px 4px;
            border-bottom: 3px solid #1a2a5e;
            position: relative;
            background: #fff;
        }
        .header::after {
            content: '';
            position: absolute;
            bottom: -5px; left: 4px; right: 30px;
            height: 2px;
            background: linear-gradient(to right, #c0392b 35%, transparent);
        }
        .header-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            width: 100%;
            min-height: 88px;
        }
        .header-brand {
            display: flex;
            align-items: center;
            gap: 10px;
            flex: 0 1 auto;
            min-width: 0;
            margin-left: -6px;
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
        .header-brand--stacked {
            flex: 0 1 auto;
            flex-direction: column;
            align-items: center;
            gap: 6px;
            text-align: center;
        }
        .lab-logo {
            height: 98px;
            width: auto;
            max-width: 260px;
            object-fit: contain;
            display: block;
            flex-shrink: 0;
        }
        .lab-logo--stacked {
            height: 128px;
            max-width: 240px;
        }
        .lab-logo--portrait {
            height: 118px;
            max-width: 148px;
        }
        .header-brand--portrait {
            --brand-pair-height: 74px;
            flex-direction: row;
            align-items: center;
            gap: 8px;
            height: var(--brand-pair-height);
        }
        .header-brand--portrait .lab-logo,
        .header-brand--portrait .lab-logo--portrait {
            height: var(--brand-pair-height);
            width: auto;
            max-width: none;
            max-height: var(--brand-pair-height);
            object-fit: contain;
            align-self: center;
        }
        .header-brand--portrait .brand-name {
            height: var(--brand-pair-height);
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 3px;
        }
        .header-brand--portrait .brand-name h1 {
            line-height: 1;
        }
        .header-brand--portrait .brand-name .tagline {
            margin-top: 0;
            line-height: 1.1;
        }
        .brand-name--centered {
            text-align: center;
        }
        .brand-name {
            padding: 0;
            background: transparent;
            flex: 0 1 auto;
            min-width: 0;
        }
        .brand-name h1 {
            font-size: 33px;
            font-weight: 900;
            letter-spacing: 0.5px;
            line-height: 1.1;
        }
        .brand-tyagi { color: #1f2f57; }
        .brand-pathology { color: #8b2332; }
        .brand-name .tagline {
            font-size: 10px;
            color: #1f2f57;
            font-weight: 700;
            letter-spacing: 1.2px;
            text-transform: uppercase;
            margin-top: 5px;
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
            font-size: 12.5px;
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
            font-size: 13.5px;
            font-weight: 800;
            color: #1a2a5e;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .report-title h2 {
            font-size: 17px;
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
            font-size: 13px;
        }
        table.report thead { display: table-header-group; }
        table.report thead tr { background: #1a2a5e; color: #fff; }
        table.report thead th {
            padding: 7px 10px;
            text-align: left;
            font-size: 12.5px;
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
            padding: 6px 10px;
            color: #222;
            vertical-align: middle;
        }
        table.report tbody td.method,
        table.report .method {
            font-size: 10.5px;
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
            page-break-inside: avoid;
            break-inside: avoid;
        }
        .fbs-reference {
            margin: 6px 30px 2px;
            page-break-inside: avoid;
            break-inside: avoid;
        }
        .fbs-ref-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
        }
        .fbs-ref-table th,
        .fbs-ref-table td {
            border: 1px solid #cfd3da;
            padding: 4px 6px;
            text-align: left;
        }
        .fbs-ref-table thead th {
            background: #f1f3f7;
            font-weight: 800;
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
            page-break-before: avoid;
            break-before: avoid;
            page-break-inside: avoid;
            break-inside: avoid;
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
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            z-index: 10;
            background: #fff;
            box-sizing: border-box;
        }
        .legal-disclaimer {
            text-align: center;
            font-size: 10.5px;
            font-weight: 800;
            letter-spacing: 0.7px;
            color: #333;
            padding: 10px 0 12px;
            text-transform: uppercase;
            background: #fff;
        }
        .footer {
            background: #1a2a5e;
            color: #fff;
            padding: 14px 10px;
            width: 100%;
            margin: 0;
            box-sizing: border-box;
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
        .page-content {
            position: relative;
            z-index: 1;
            padding-bottom: 32mm;
        }
        .panel-section {
            page-break-inside: avoid;
            break-inside: avoid;
        }
        .report-closing {
            page-break-inside: avoid;
            break-inside: avoid;
        }
        .widal-section { margin: 10px 30px 14px; }
        .widal-section .report-table-wrap {
            page-break-inside: avoid;
            break-inside: avoid;
        }
        .widal-title {
            text-align: center;
            font-size: 13px;
            font-weight: 800;
            letter-spacing: 0.3px;
            margin-bottom: 10px;
            text-transform: uppercase;
        }
        .widal-summary { margin-bottom: 8px; }
        .widal-overall { font-weight: 800; text-transform: uppercase; }
        .widal-overall.positive { color: #c0392b; }
        .widal-grid th,
        .widal-grid td {
            text-align: center;
            font-size: 11.5px;
        }
        .widal-grid .widal-antigen,
        .widal-grid .widal-antigen-col {
            text-align: left;
            font-weight: 700;
        }
        .widal-note {
            margin-top: 8px;
            font-size: 10.5px;
            font-weight: 700;
            text-transform: uppercase;
        }
        .widal-end {
            margin-top: 10px;
            text-align: center;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.5px;
            page-break-before: avoid;
            break-before: avoid;
        }
        @media print {
            @page {
                size: A4 portrait;
                margin: 0;
            }
            html, body {
                width: 100% !important;
                max-width: none !important;
                margin: 0 !important;
                padding: 0 !important;
            }
            .print-layout, .page, .page-header {
                width: 100% !important;
                max-width: none !important;
                margin: 0 !important;
            }
            .page-footer {
                width: 100% !important;
                max-width: none !important;
                margin: 0 !important;
                left: 0 !important;
                right: 0 !important;
            }
            .footer {
                width: 100% !important;
                max-width: none !important;
                margin: 0 !important;
                padding-top: 14px !important;
                padding-bottom: 14px !important;
                padding-left: 10px !important;
                padding-right: 10px !important;
            }
        }
    `;
}
