import { useEffect, useState } from 'react';
import { PickList } from 'primereact/picklist';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { testCategoryService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

function getCategoryId(test) {
    return test.test_category_id || test.category?.id;
}

function testItemTemplate(item) {
    return (
        <div>
            <strong>{item.name}</strong>
            <div className="text-muted">
                {item.category?.name || 'Uncategorized'} · {item.code}
            </div>
        </div>
    );
}

export default function ProfileTestPicker({ source, target, onChange }) {
    const toast = useToast();
    const [categories, setCategories] = useState([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState(null);

    useEffect(() => {
        testCategoryService.list({ per_page: 100, status: 'active' }).then(({ data }) => {
            setCategories(data.data);
        }).catch(() => {});
    }, []);

    const categoryOptions = categories.map((c) => ({
        label: `${c.name} (${c.tests_count || 0} tests)`,
        value: c.id,
        code: c.code,
    }));

    function addTestsFromCategory() {
        if (!selectedCategoryId) {
            toast.error('Select a category first');
            return;
        }

        const selectedIds = new Set(target.map((t) => t.id));
        const toAdd = source.filter(
            (t) => getCategoryId(t) === selectedCategoryId && !selectedIds.has(t.id),
        );

        if (!toAdd.length) {
            const category = categories.find((c) => c.id === selectedCategoryId);
            toast.warn(`All tests from "${category?.name || 'category'}" are already selected`);
            return;
        }

        const toAddIds = new Set(toAdd.map((t) => t.id));
        onChange(
            source.filter((t) => !toAddIds.has(t.id)),
            [...target, ...toAdd],
        );
        toast.success(`Added ${toAdd.length} test(s) from category`);
    }

    function addAllFromCategory(categoryId) {
        setSelectedCategoryId(categoryId);
        const selectedIds = new Set(target.map((t) => t.id));
        const toAdd = source.filter(
            (t) => getCategoryId(t) === categoryId && !selectedIds.has(t.id),
        );

        if (!toAdd.length) return;

        const toAddIds = new Set(toAdd.map((t) => t.id));
        onChange(
            source.filter((t) => !toAddIds.has(t.id)),
            [...target, ...toAdd],
        );
    }

    return (
        <div>
            <div style={{ marginBottom: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 0.75rem' }}>Add by Category</h4>
                <p className="text-muted" style={{ margin: '0 0 1rem', fontSize: '0.9rem' }}>
                    Select a category (e.g. CBC) to add all its tests at once.
                </p>
                <div className="filter-bar" style={{ marginBottom: '0.75rem' }}>
                    <Dropdown
                        value={selectedCategoryId}
                        options={categoryOptions}
                        onChange={(e) => setSelectedCategoryId(e.value)}
                        placeholder="Select category (CBC, LFT, ...)"
                        filter
                        filterBy="label,code"
                        showClear
                        style={{ minWidth: 280 }}
                    />
                    <Button
                        type="button"
                        label="Add Category Tests"
                        icon="pi pi-plus"
                        onClick={addTestsFromCategory}
                        disabled={!selectedCategoryId}
                    />
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {categories.map((cat) => (
                        <Button
                            key={cat.id}
                            type="button"
                            label={`+ ${cat.code}`}
                            size="small"
                            outlined
                            severity="secondary"
                            onClick={() => addAllFromCategory(cat.id)}
                            title={`Add all ${cat.name} tests`}
                        />
                    ))}
                </div>
            </div>

            <p className="text-muted" style={{ marginBottom: '0.75rem' }}>
                Or move individual tests to the right — order is saved as profile test order.
            </p>

            <PickList
                source={source}
                target={target}
                onChange={(e) => onChange(e.source, e.target)}
                itemTemplate={testItemTemplate}
                sourceHeader="Available Tests"
                targetHeader="Selected Tests"
                filter
                filterBy="name,code,category.name"
            />
        </div>
    );
}
