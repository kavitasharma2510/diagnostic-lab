import { NavLink } from 'react-router-dom';

const modules = [
    {
        label: 'Module 1 — Test & Profile',
        children: [
            { label: 'Test Categories', icon: 'pi pi-tags', to: '/test-categories' },
            { label: 'Lab Tests', icon: 'pi pi-flask', to: '/lab-tests' },
            { label: 'Profiles', icon: 'pi pi-box', to: '/profiles' },
        ],
    },
    {
        label: 'Patient & Billing',
        children: [
            { label: 'Patients', icon: 'pi pi-users', to: '/patients' },
            { label: 'Bills', icon: 'pi pi-wallet', to: '/bills' },
        ],
    },
    {
        label: 'Module 2 — Sample Collection',
        children: [
            { label: 'Pending Samples', icon: 'pi pi-clock', to: '/samples/pending' },
            { label: 'Collected Samples', icon: 'pi pi-inbox', to: '/samples' },
        ],
    },
    {
        label: 'Module 3 & 4 — Reports',
        children: [
            { label: 'Reports', icon: 'pi pi-file-pdf', to: '/reports' },
            { label: 'Result Entry', icon: 'pi pi-pencil', to: '/reports/entry' },
        ],
    },
];

export default function AppSidebar() {
    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <i className="pi pi-heart-fill" style={{ color: '#2563eb', fontSize: '1.5rem' }} />
                <div>
                    <strong>Diagnostic Lab</strong>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>MERN — MongoDB + Express + React</div>
                </div>
            </div>
            <nav>
                {modules.map((module) => (
                    <div key={module.label}>
                        <div className="nav-group-label">{module.label}</div>
                        {module.children.map((child) => (
                            <NavLink key={child.to} to={child.to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                <i className={child.icon} />
                                <span>{child.label}</span>
                            </NavLink>
                        ))}
                    </div>
                ))}
            </nav>
        </aside>
    );
}
