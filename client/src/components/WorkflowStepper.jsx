import { NavLink, useLocation } from 'react-router-dom';

const STEPS = [
    { step: 1, label: 'Test Categories', icon: 'pi pi-tags', to: '/test-categories' },
    { step: 2, label: 'Lab Tests', icon: 'pi pi-flask', to: '/lab-tests' },
    { step: 3, label: 'Registration', icon: 'pi pi-user-plus', to: '/booking' },
    { step: 4, label: 'Reports', icon: 'pi pi-file-pdf', to: '/reports' },
];

function stepFromPath(pathname) {
    if (pathname.startsWith('/test-categories')) return 1;
    if (pathname.startsWith('/lab-tests')) return 2;
    if (pathname.startsWith('/booking')) return 3;
    if (pathname.startsWith('/reports')) return 4;
    return 0;
}

export default function WorkflowStepper() {
    const { pathname } = useLocation();
    const current = stepFromPath(pathname);

    if (!current) return null;

    return (
        <nav className="workflow-stepper" aria-label="Workflow">
            {STEPS.map((item) => (
                <NavLink
                    key={item.to}
                    to={item.to}
                    className={`workflow-step ${current === item.step ? 'active' : ''} ${current > item.step ? 'done' : ''}`}
                >
                    <i className={item.icon} />
                    <span>{item.label}</span>
                </NavLink>
            ))}
        </nav>
    );
}
