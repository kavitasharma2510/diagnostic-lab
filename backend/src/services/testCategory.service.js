import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { buildPagination, paginatedResponse, paginatedList } from '../utils/pagination.js';
import { serialize } from '../utils/serialize.js';
import { parseId } from '../utils/parseId.js';

/** Count tests in a category — grouped panels count their parameters (e.g. CBC = 19). */
async function resolveCategoryTestsCount(categoryId) {
    const tests = await prisma.labTest.findMany({
        where: { testCategoryId: categoryId, status: 'active' },
        include: { _count: { select: { parameters: true } } },
    });

    const groupedWithParams = tests.filter(
        (t) => t.reportType === 'grouped' && t._count.parameters > 0,
    );

    if (groupedWithParams.length) {
        return groupedWithParams.reduce((sum, t) => sum + t._count.parameters, 0);
    }

    return tests.length;
}

export const testCategoryService = {
    async list(filters = {}) {
        const { currentPage, limit, skip } = buildPagination(filters.page, filters.per_page);
        const where = {};

        if (filters.search) {
            where.OR = [
                { name: { contains: filters.search } },
                { code: { contains: filters.search } },
            ];
        }

        if (filters.status) {
            where.status = filters.status;
        }

        const [total, rows] = await paginatedList(
            prisma.testCategory.count({ where }),
            prisma.testCategory.findMany({
                where,
                skip,
                take: limit,
                orderBy: { name: 'asc' },
                include: { _count: { select: { labTests: true } } },
            }),
        );

        const data = await Promise.all(rows.map(async (row) => ({
            ...serialize(row),
            tests_count: await resolveCategoryTestsCount(row.id),
        })));

        return paginatedResponse(data, total, currentPage, limit);
    },

    async getById(id) {
        const category = await prisma.testCategory.findUnique({
            where: { id: parseId(id) },
            include: {
                labTests: {
                    where: { status: 'active' },
                    orderBy: [{ reportType: 'desc' }, { sortOrder: 'asc' }, { name: 'asc' }],
                    include: {
                        parameters: { where: { status: 'active' }, orderBy: { sortOrder: 'asc' } },
                    },
                },
            },
        });

        if (!category) {
            throw new AppError('Test category not found', 404);
        }

        const tests_count = await resolveCategoryTestsCount(category.id);

        return serialize({
            ...category,
            tests_count,
            lab_tests: category.labTests.map((t) => ({
                ...serialize(t),
                report_type: t.reportType,
                sample_type: t.sampleType,
                parameters_count: t.parameters?.length || 0,
                parameters: t.parameters?.map((p) => serialize({
                    ...p,
                    reference_range: p.referenceRange,
                    sort_order: p.sortOrder,
                })),
            })),
        });
    },

    async create(data) {
        const category = await prisma.testCategory.create({ data });
        return serialize({ ...category, tests_count: 0 });
    },

    async update(id, data) {
        try {
            const category = await prisma.testCategory.update({
                where: { id: parseId(id) },
                data,
                include: { _count: { select: { labTests: true } } },
            });

            return serialize({
                ...category,
                tests_count: await resolveCategoryTestsCount(category.id),
            });
        } catch {
            throw new AppError('Test category not found', 404);
        }
    },

    async remove(id) {
        const linked = await prisma.labTest.count({
            where: { testCategoryId: parseId(id) },
        });

        if (linked > 0) {
            throw new AppError('Cannot delete category with associated tests.', 422, {
                category: ['Cannot delete category with associated tests.'],
            });
        }

        try {
            await prisma.testCategory.delete({ where: { id: parseId(id) } });
        } catch {
            throw new AppError('Test category not found', 404);
        }
    },
};
