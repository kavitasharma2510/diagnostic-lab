import { ProgressSpinner } from 'primereact/progressspinner';

export default function PageLoader({ message = 'Loading...' }) {
    return (
        <div className="page-loader">
            <ProgressSpinner style={{ width: '48px', height: '48px' }} strokeWidth="4" />
            <p>{message}</p>
        </div>
    );
}
