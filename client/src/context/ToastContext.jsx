import { createContext, useContext } from 'react';

export const ToastContext = createContext(null);

export function useToast() {
    const ref = useContext(ToastContext);

    return {
        success: (detail, summary = 'Success') => ref?.current?.show({ severity: 'success', summary, detail, life: 3000 }),
        error: (detail, summary = 'Error') => ref?.current?.show({ severity: 'error', summary, detail, life: 5000 }),
    };
}
