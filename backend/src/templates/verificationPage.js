export function verificationHtml(data) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Verify Report ${data.report_no}</title>
    <style>
        body { font-family: Arial, sans-serif; background: #f8fafc; margin: 0; padding: 2rem; }
        .card { max-width: 480px; margin: 0 auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1.5rem; }
        h1 { font-size: 1.25rem; margin: 0 0 1rem; color: #1e40af; }
        .row { margin: 0.75rem 0; }
        label { display: block; font-size: 0.75rem; color: #64748b; text-transform: uppercase; }
        span { font-weight: 600; }
        .ok { color: #15803d; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 0.75rem; border-radius: 6px; margin-top: 1rem; }
    </style>
</head>
<body>
    <div class="card">
        <h1>Report Verification</h1>
        <div class="row"><label>Report No</label><span>${data.report_no}</span></div>
        <div class="row"><label>Patient Name</label><span>${data.patient_name}</span></div>
        <div class="row"><label>Report Date</label><span>${new Date(data.report_date).toLocaleDateString()}</span></div>
        <div class="row"><label>Status</label><span>${data.status}</span></div>
        <div class="ok">${data.authenticity_message}</div>
    </div>
</body>
</html>`;
}
