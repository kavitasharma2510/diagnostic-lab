import AppSidebar from './AppSidebar';
import AppTopbar from './AppTopbar';

export default function AppLayout({ children }) {
    return (
        <div className="app-shell">
            <AppSidebar />
            <main className="app-main">
                <div className="app-main-inner">
                    <AppTopbar />
                    <div className="app-page-content">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
