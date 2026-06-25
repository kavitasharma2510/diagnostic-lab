import AppSidebar from './AppSidebar';

export default function AppLayout({ children }) {
    return (
        <div className="app-shell">
            <AppSidebar />
            <main className="app-main">{children}</main>
        </div>
    );
}
