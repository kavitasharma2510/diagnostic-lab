import { Button } from 'primereact/button';

export default function AppTopbar({ onMenuToggle }) {
    const today = new Date().toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    return (
        <header className="app-topbar">
            <div className="topbar-left">
                <Button
                    type="button"
                    icon="pi pi-bars"
                    className="menu-toggle p-button-text"
                    onClick={onMenuToggle}
                    aria-label="Open menu"
                />
                <div className="topbar-copy">
                    <h2 className="topbar-greeting">Welcome back</h2>
                    <p className="topbar-date">{today}</p>
                </div>
            </div>
            <div className="topbar-right">
                <span className="topbar-status">
                    <i className="pi pi-circle-fill" />
                    <span className="topbar-status-text">System Online</span>
                </span>
            </div>
        </header>
    );
}
