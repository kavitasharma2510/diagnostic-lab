export default function AppTopbar() {
    const today = new Date().toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    return (
        <header className="app-topbar">
            <div className="topbar-left">
                <h2 className="topbar-greeting">Welcome back</h2>
                <p className="topbar-date">{today}</p>
            </div>
            <div className="topbar-right">
                <span className="topbar-status">
                    <i className="pi pi-circle-fill" />
                    System Online
                </span>
            </div>
        </header>
    );
}
