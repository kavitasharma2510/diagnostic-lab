import { Button } from 'primereact/button';

export default function PageHeader({ title, subtitle, actionLabel, actionIcon = 'pi pi-plus', onAction, children }) {
    const hasActions = children || (actionLabel && onAction);

    return (
        <div className="page-header">
            <div className="page-header-text">
                <h1 className="page-title">{title}</h1>
                {subtitle && <p className="text-muted">{subtitle}</p>}
            </div>
            {hasActions && (
                <div className="page-header-actions">
                    {children}
                    {actionLabel && onAction && (
                        <Button label={actionLabel} icon={actionIcon} onClick={onAction} />
                    )}
                </div>
            )}
        </div>
    );
}
