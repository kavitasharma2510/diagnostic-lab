import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { buildPagination, paginatedResponse, paginatedList } from '../utils/pagination.js';
import { serialize } from '../utils/serialize.js';
import { parseId } from '../utils/parseId.js';

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

        const data = rows.map((row) => ({
            ...serialize(row),
            tests_count: row._count.labTests,
        }));

        return paginatedResponse(data, total, currentPage, limit);
    },

    async getById(id) {
        const category = await prisma.testCategory.findUnique({
            where: { id: parseId(id) },
            include: { _count: { select: { labTests: true } } },
        });

        if (!category) {
            throw new AppError('Test category not found', 404);
        }

        return serialize({ ...category, tests_count: category._count.labTests });
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

            return serialize({ ...category, tests_count: category._count.labTests });
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
