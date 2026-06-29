import { useEffect, useMemo, useState } from 'react';
import { MultiSelect } from 'primereact/multiselect';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { InputText } from 'primereact/inputtext';
import { testCategoryService } from '../../services/api';

function normalizeId(id) {
    if (id == null) return '';
    if (typeof id === 'object' && id.id) return String(id.id);
    if (typeof id === 'object' && id.value) return String(id.value);
    return String(id);
}

function getCategoryId(test) {
    return test.test_category_id || test.category?.id;
}

const CODE_ALIASES = { FBC: 'FBS', FBS: 'FBC' };

function testBelongsToCategories(test, categoryIds, categories) {
    if (!categoryIds.length) return true;

    const idSet = new Set(categoryIds.map(normalizeId));
    const testCatId = normalizeId(getCategoryId(test));
    if (testCatId && idSet.has(testCatId)) return true;

    const selectedCodes = new Set(
        categories
            .filter((c) => idSet.has(normalizeId(c.id)))
            .map((c) => (c.code || '').toUpperCase()),
    );

    const testCatCode = (test.category?.code || '').toUpperCase();
    const testCode = (test.code || '').toUpperCase();

    for (const code of selectedCodes) {
        if (code && (testCatCode === code || testCode === code)) return true;
        const alias = CODE_ALIASES[code];
        if (alias && (testCatCode === alias || testCode === alias)) return true;
    }

    return false;
}

export default function BookingTestPicker({ allTests, selectedTests, onChange }) {
    const [categories, setCategories] = useState([]);
    const [filterCategoryIds, setFilterCategoryIds] = useState([]);
    const [search, setSearch] = useState('');

    useEffect(() => {
        testCategoryService.list({ per_page: 100, status: 'active' }).then(({ data }) => {
            setCategories(data.data);
        }).catch(() => {});
    }, []);

    const selectedIds = useMemo(
        () => new Set(selectedTests.map((t) => t.id)),
        [selectedTests],
    );

    const categoryOptions = categories.map((c) => ({
        label: `${c.code} — ${c.name}`,
        value: c.id,
        code: c.code,
    }));

    const normalizedFilterIds = useMemo(
        () => filterCategoryIds.map(normalizeId).filter(Boolean),
        [filterCategoryIds],
    );

    const visibleTests = useMemo(() => {
        let list = allTests;
        if (normalizedFilterIds.length) {
            list = list.filter((t) => testBelongsToCategories(t, normalizedFilterIds, categories));
        }
        const q = search.trim().toLowerCase();
        if (q) {
            list = list.filter(
                (t) => t.name?.toLowerCase().includes(q)
                    || t.code?.toLowerCase().includes(q)
                    || t.category?.name?.toLowerCase().includes(q)
                    || t.category?.code?.toLowerCase().includes(q),
            );
        }
        return list;
    }, [allTests, normalizedFilterIds, categories, search]);

    function toggleTest(test) {
        if (selectedIds.has(test.id)) {
            onChange(selectedTests.filter((t) => t.id !== test.id));
        } else {
            onChange([...selectedTests, test]);
        }
    }

    function selectAllVisible() {
        const merged = [...selectedTests];
        const ids = new Set(merged.map((t) => t.id));
        for (const test of visibleTests) {
            if (!ids.has(test.id)) merged.push(test);
        }
        onChange(merged);
    }

    function clearSelection() {
        onChange([]);
    }

    function toggleCategoryChip(categoryId) {
        const id = normalizeId(categoryId);
        setFilterCategoryIds((prev) => {
            const normalized = prev.map(normalizeId);
            return normalized.includes(id)
                ? prev.filter((x) => normalizeId(x) !== id)
                : [...prev, categoryId];
        });
    }

    return (
        <div className="booking-test-picker">
            <div className="booking-picker-filters">
                <label className="booking-picker-label">Filter by category</label>
                <MultiSelect
                    value={filterCategoryIds}
                    options={categoryOptions}
                    optionLabel="label"
                    optionValue="value"
                    onChange={(e) => setFilterCategoryIds(e.value || [])}
                    placeholder="Select one or more categories"
                    display="chip"
                    filter
                    filterBy="label,code"
                    className="booking-category-multiselect"
                />
                <div className="booking-category-chips">
                    {categories.map((cat) => {
                        const active = normalizedFilterIds.includes(normalizeId(cat.id));
                        return (
                            <Button
                                key={cat.id}
                                type="button"
                                label={cat.code}
                                size="small"
                                outlined={!active}
                                severity={active ? 'info' : 'secondary'}
                                onClick={() => toggleCategoryChip(cat.id)}
                                title={cat.name}
                            />
                        );
                    })}
                </div>
            </div>

            <div className="booking-picker-toolbar">
                <span className="p-input-icon-left booking-search-wrap">
                    <i className="pi pi-search" />
                    <InputText
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search tests..."
                        className="booking-search-input"
                    />
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button
                        type="button"
                        label="Select all shown"
                        size="small"
                        outlined
                        disabled={!visibleTests.length}
                        onClick={selectAllVisible}
                    />
                    <Button
                        type="button"
                        label="Clear selected"
                        size="small"
                        outlined
                        severity="secondary"
                        disabled={!selectedTests.length}
                        onClick={clearSelection}
                    />
                </div>
            </div>

            <div className="booking-test-list">
                {!normalizedFilterIds.length ? (
                    <p className="text-muted booking-hint">Select a category above to see its tests.</p>
                ) : visibleTests.length === 0 ? (
                    <p className="text-muted booking-hint">No tests found for the selected categories.</p>
                ) : (
                    visibleTests.map((test) => (
                        <label key={test.id} className="booking-test-row">
                            <Checkbox
                                checked={selectedIds.has(test.id)}
                                onChange={() => toggleTest(test)}
                            />
                            <div className="booking-test-info">
                                <strong>{test.name}</strong>
                                <span className="text-muted">
                                    {test.category?.name} · {test.code} · ₹{Number(test.price || 0).toFixed(0)}
                                </span>
                            </div>
                        </label>
                    ))
                )}
            </div>

            {selectedTests.length > 0 && (
                <div className="booking-selected-summary">
                    <div className="booking-selected-header">
                        <strong>{selectedTests.length} test(s) selected</strong>
                        <span className="text-muted">
                            Total: ₹{selectedTests.reduce((s, t) => s + Number(t.price || 0), 0).toFixed(0)}
                        </span>
                    </div>
                    <div className="booking-selected-tags">
                        {selectedTests.map((test) => (
                            <Tag
                                key={test.id}
                                value={test.code}
                                severity="info"
                                style={{ cursor: 'pointer' }}
                                onClick={() => toggleTest(test)}
                                title={`Remove ${test.name}`}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
