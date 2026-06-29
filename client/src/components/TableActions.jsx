import { Button } from 'primereact/button';

export default function TableActions({ actions = [] }) {
    return (
        <div className="table-actions">
            {actions.map((action) => (
                <Button
                    key={action.key || action.title}
                    icon={action.icon}
                    text
                    className="table-action-btn"
                    title={action.title}
                    aria-label={action.title}
                    onClick={action.onClick}
                />
            ))}
        </div>
    );
}
