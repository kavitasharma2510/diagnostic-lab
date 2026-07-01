import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import AppTopbar from './AppTopbar';

export default function AppLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        setSidebarOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        document.body.style.overflow = sidebarOpen ? 'hidden' : '';
        return () => {
            document.body.style.overflow = '';
        };
    }, [sidebarOpen]);

    return (
        <div className={`app-shell ${sidebarOpen ? 'sidebar-open' : ''}`}>
            <button
                type="button"
                className="sidebar-backdrop"
                aria-label="Close menu"
                onClick={() => setSidebarOpen(false)}
            />
            <AppSidebar onNavigate={() => setSidebarOpen(false)} />
            <main className="app-main">
                <div className="app-main-inner">
                    <AppTopbar onMenuToggle={() => setSidebarOpen((open) => !open)} />
                    <div className="app-page-content">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
