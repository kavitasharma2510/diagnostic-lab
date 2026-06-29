import { NavLink } from 'react-router-dom';

const flow = [
    { step: '01', label: 'Test Categories', icon: 'pi pi-tags', to: '/test-categories' },
    { step: '02', label: 'Lab Tests', icon: 'pi pi-flask', to: '/lab-tests' },
    { step: '03', label: 'Registration', icon: 'pi pi-user-plus', to: '/booking' },
    { step: '04', label: 'Reports', icon: 'pi pi-file-pdf', to: '/reports' },
];

export default function AppSidebar() {
    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <img
                    src="/assets/tyagi-pathology-logo.png"
                    alt="Tyagi Pathology"
                    className="sidebar-logo"
                />
                <div className="sidebar-brand-text">
                    <p className="sidebar-brand-name">
                        <span className="brand-tyagi">TYAGI</span>
                        <span className="brand-pathology"> PATHOLOGY</span>
                    </p>
                    <p className="sidebar-tagline">Laboratory Information System</p>
                </div>
            </div>
            <nav className="sidebar-nav">
                <p className="sidebar-nav-label">Workflow</p>
                {flow.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                        <span className="nav-step">{item.step}</span>
                        <span className="nav-link-body">
                            <i className={item.icon} />
                            <span>{item.label}</span>
                        </span>
                    </NavLink>
                ))}
            </nav>
            <div className="sidebar-footer">
                <span>Accurate · Reliable · Trusted</span>
            </div>
        </aside>
    );
}
