export function printBarcodeLabel(label) {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Barcode Label - ${label.sample_no}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 16px; }
        .label { width: 280px; border: 1px solid #000; padding: 12px; }
        .lab { font-weight: bold; font-size: 14px; text-align: center; }
        .barcode { font-family: 'Courier New', monospace; font-size: 22px; letter-spacing: 2px; text-align: center; margin: 12px 0; }
        .row { font-size: 12px; margin: 4px 0; }
        .sample-no { font-size: 13px; font-weight: bold; text-align: center; }
    </style>
</head>
<body>
    <div class="label">
        <div class="lab">${label.lab_name}</div>
        <div class="barcode">*${label.barcode}*</div>
        <div class="sample-no">${label.sample_no}</div>
        <div class="row"><strong>Patient:</strong> ${label.patient_name || '—'}</div>
        <div class="row"><strong>Bill:</strong> ${label.bill_no || '—'}</div>
        <div class="row"><strong>Sample:</strong> ${label.sample_type || '—'}</div>
        <div class="row"><strong>Collected:</strong> ${label.collected_at ? new Date(label.collected_at).toLocaleString() : '—'}</div>
    </div>
    <script>window.onload = () => { window.print(); }</script>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=400,height=500');
    if (win) {
        win.document.write(html);
        win.document.close();
    }
}
