import { Tag } from 'primereact/tag';

export default function StatusBadge({ status }) {
    return (
        <Tag
            value={status === 'active' ? 'Active' : 'Inactive'}
            severity={status === 'active' ? 'success' : 'secondary'}
        />
    );
}
