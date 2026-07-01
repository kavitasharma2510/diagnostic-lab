import { useEffect, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { reportService } from '../services/api';
import { useToast } from '../context/ToastContext';

function normalizeMobileInput(value) {
    return String(value ?? '').replace(/\D/g, '');
}

function parseMobilesFromInput(text) {
    const parts = String(text ?? '').split(/[,;\n]+/);
    const parsed = parts
        .map((part) => {
            const digits = normalizeMobileInput(part);
            if (digits.length === 10) return digits;
            if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
            if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
            if (digits.length > 10) return digits.slice(-10);
            return null;
        })
        .filter((digits) => digits && digits.length === 10);

    return [...new Set(parsed)];
}

function formatDisplayMobile(mobile) {
    const digits = normalizeMobileInput(mobile);
    if (digits.length === 12 && digits.startsWith('91')) {
        const local = digits.slice(2);
        return `+91 ${local.slice(0, 5)} ${local.slice(5)}`;
    }
    if (digits.length === 10) {
        return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
    }
    return mobile;
}

export default function WhatsAppShareDialog({
    visible,
    onHide,
    reportId,
    defaultMobile = '',
    patientName = '',
}) {
    const toast = useToast();
    const [mobileInput, setMobileInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState('input');
    const [shareLinks, setShareLinks] = useState([]);
    const [shareWarning, setShareWarning] = useState('');

    useEffect(() => {
        if (!visible) {
            setStep('input');
            setShareLinks([]);
            setShareWarning('');
            return;
        }

        const initial = normalizeMobileInput(defaultMobile);
        if (initial.length === 10) {
            setMobileInput(initial);
        } else if (initial.length === 12 && initial.startsWith('91')) {
            setMobileInput(initial.slice(2));
        } else if (initial.length === 11 && initial.startsWith('0')) {
            setMobileInput(initial.slice(1));
        } else {
            setMobileInput(defaultMobile ? String(defaultMobile).trim() : '');
        }
    }, [visible, defaultMobile]);

    function handleClose() {
        setStep('input');
        setShareLinks([]);
        setShareWarning('');
        onHide();
    }

    async function handlePrepare() {
        const mobiles = parseMobilesFromInput(mobileInput);
        if (!mobiles.length) {
            toast.error('Enter at least one valid 10-digit mobile number');
            return;
        }

        setLoading(true);
        try {
            const { data } = await reportService.whatsappLink(reportId, mobiles.join(','));
            const urls = data.data.whatsapp_urls || [{ mobile: '', whatsapp_url: data.data.whatsapp_url }];
            setShareLinks(urls);
            setShareWarning(data.data.share_url_warning || '');
            setStep('send');
        } catch (e) {
            toast.error(e.response?.data?.message || 'WhatsApp link failed');
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog
            header="Share via WhatsApp"
            visible={visible}
            onHide={handleClose}
            className="dialog-fluid-wide"
            modal
            dismissableMask
        >
            {step === 'input' ? (
                <>
                    <p className="text-muted" style={{ marginBottom: '1rem' }}>
                        {patientName
                            ? `Send report for ${patientName} to one or more WhatsApp numbers.`
                            : 'Send this report to one or more WhatsApp numbers.'}
                    </p>

                    <div className="form-field">
                        <label htmlFor="whatsapp-mobiles">Mobile numbers</label>
                        <InputText
                            id="whatsapp-mobiles"
                            value={mobileInput}
                            onChange={(e) => setMobileInput(e.target.value)}
                            placeholder="9876543210 or comma-separated numbers"
                            className="w-full"
                            disabled={loading}
                            onKeyDown={(e) => e.key === 'Enter' && handlePrepare()}
                        />
                        <small className="text-muted">
                            Separate multiple numbers with commas. Patient mobile is pre-filled when available.
                        </small>
                    </div>

                    <div className="page-header-actions" style={{ marginTop: '1.25rem' }}>
                        <Button label="Cancel" severity="secondary" outlined onClick={handleClose} disabled={loading} />
                        <Button
                            label="Continue"
                            icon="pi pi-arrow-right"
                            iconPos="right"
                            onClick={handlePrepare}
                            loading={loading}
                        />
                    </div>
                </>
            ) : (
                <>
                    <p className="text-muted" style={{ marginBottom: '1rem' }}>
                        Click each button below to open WhatsApp for that number.
                        {shareLinks.length > 1 && ' Browsers only allow one chat per click.'}
                    </p>

                    {shareWarning && (
                        <div className="whatsapp-share-warning">
                            <i className="pi pi-exclamation-triangle" />
                            <span>{shareWarning}</span>
                        </div>
                    )}

                    <div className="whatsapp-share-links">
                        {shareLinks.map((item) => (
                            <a
                                key={item.mobile || item.whatsapp_url}
                                href={item.whatsapp_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="whatsapp-share-link"
                            >
                                <i className="pi pi-whatsapp" />
                                <span>{formatDisplayMobile(item.mobile)}</span>
                                <i className="pi pi-external-link" />
                            </a>
                        ))}
                    </div>

                    <div className="page-header-actions" style={{ marginTop: '1.25rem' }}>
                        <Button
                            label="Back"
                            severity="secondary"
                            outlined
                            icon="pi pi-arrow-left"
                            onClick={() => setStep('input')}
                        />
                        <Button label="Done" onClick={handleClose} />
                    </div>
                </>
            )}
        </Dialog>
    );
}
