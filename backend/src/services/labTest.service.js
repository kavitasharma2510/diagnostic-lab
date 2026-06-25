import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { buildPagination, paginatedResponse } from '../utils/pagination.js';
import { serialize } from '../utils/serialize.js';
import { parseId } from '../utils/parseId.js';

function mapLabTest(row) {
    return serialize({
        ...row,
        test_category_id: row.testCategoryId,
        sample_type: row.sampleType,
        report_type: row.reportType,
        default_value: row.defaultValue,
        reference_range: row.referenceRange,
        min_value: row.minValue,
        max_value: row.maxValue,
        sort_order: row.sortOrder,
        parameters_count: row._count?.parameters ?? undefined,
        category: row.category
            ? {
                id: row.category.id,
                name: row.category.name,
                code: row.category.code,
            }
            : undefined,
        parameters: row.parameters?.map((p) => ({
            ...serialize(p),
            test_id: p.labTestId,
            reference_range: p.referenceRange,
            min_value: p.minValue,
            max_value: p.maxValue,
            sort_order: p.sortOrder,
        })),
    });
}

export const labTestService = {
    async list(filters = {}) {
        const { currentPage, limit, skip } = buildPagination(filters.page, filters.per_page);
        const where = {};

        if (filters.search) {
            where.OR = [
                { name: { contains: filters.search } },
                { code: { contains: filters.search } },
                { sampleType: { contains: filters.search } },
            ];
        }

        if (filters.test_category_id) {
            where.testCategoryId = parseId(filters.test_category_id);
        }

        if (filters.sample_type) {
            where.sampleType = { contains: filters.sample_type };
        }

        if (filters.status) {
            where.status = filters.status;
        }

        if (filters.report_type) {
            where.reportType = filters.report_type;
        }

        const [total, rows] = await prisma.$transaction([
            prisma.labTest.count({ where }),
            prisma.labTest.findMany({
                where,
                skip,
                take: limit,
                orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
                include: {
                    category: true,
                    _count: { select: { parameters: true } },
                },
            }),
        ]);

        return paginatedResponse(rows.map(mapLabTest), total, currentPage, limit);
    },

    async getById(id) {
        const test = await prisma.labTest.findUnique({
            where: { id: parseId(id) },
            include: {
                category: true,
                parameters: { orderBy: { sortOrder: 'asc' } },
            },
        });

        if (!test) {
            throw new AppError('Test not found', 404);
        }

        return mapLabTest(test);
    },

    async create(data) {
        const test = await prisma.$transaction(async (tx) => {
            const created = await tx.labTest.create({
                data: {
                    testCategoryId: data.test_category_id,
                    name: data.name,
                    code: data.code,
                    sampleType: data.sample_type,
                    reportType: data.report_type || 'single',
                    unit: data.unit,
                    price: data.price,
                    method: data.method,
                    defaultValue: data.default_value,
                    referenceRange: data.reference_range,
                    minValue: data.min_value,
                    maxValue: data.max_value,
                    sortOrder: data.sort_order ?? 0,
                    status: data.status || 'active',
                },
            });

            if (data.parameters?.length) {
                await tx.testParameter.createMany({
                    data: data.parameters.map((param, index) => ({
                        labTestId: created.id,
                        name: param.name,
                        unit: param.unit,
                        referenceRange: param.reference_range,
                        minValue: param.min_value,
                        maxValue: param.max_value,
                        method: param.method,
                        sortOrder: param.sort_order ?? index,
                        status: param.status || 'active',
                    })),
                });
            }

            return tx.labTest.findUnique({
                where: { id: created.id },
                include: {
                    category: true,
                    parameters: { orderBy: { sortOrder: 'asc' } },
                },
            });
        });

        return mapLabTest(test);
    },

    async update(id, data) {
        const payload = {};

        const fieldMap = {
            test_category_id: 'testCategoryId',
            name: 'name',
            code: 'code',
            sample_type: 'sampleType',
            report_type: 'reportType',
            unit: 'unit',
            price: 'price',
            method: 'method',
            default_value: 'defaultValue',
            reference_range: 'referenceRange',
            min_value: 'minValue',
            max_value: 'maxValue',
            sort_order: 'sortOrder',
            status: 'status',
        };

        Object.entries(fieldMap).forEach(([inputKey, prismaKey]) => {
            if (data[inputKey] !== undefined) {
                payload[prismaKey] = data[inputKey];
            }
        });

        try {
            await prisma.labTest.update({
                where: { id: parseId(id) },
                data: payload,
            });
        } catch {
            throw new AppError('Test not found', 404);
        }

        return this.getById(id);
    },

    async remove(id) {
        const linked = await prisma.profileTestItem.count({
            where: { labTestId: parseId(id) },
        });

        if (linked > 0) {
            throw new AppError('Cannot delete test that is part of one or more profiles.', 422, {
                test: ['Cannot delete test that is part of one or more profiles.'],
            });
        }

        try {
            await prisma.$transaction([
                prisma.testParameter.deleteMany({ where: { labTestId: parseId(id) } }),
                prisma.labTest.delete({ where: { id: parseId(id) } }),
            ]);
        } catch {
            throw new AppError('Test not found', 404);
        }
    },

    async listParameters(labTestId) {
        const parameters = await prisma.testParameter.findMany({
            where: { labTestId: parseId(labTestId) },
            orderBy: { sortOrder: 'asc' },
        });

        return parameters.map((p) => serialize({
            ...p,
            test_id: p.labTestId,
            reference_range: p.referenceRange,
            min_value: p.minValue,
            max_value: p.maxValue,
            sort_order: p.sortOrder,
        }));
    },

    async createParameter(labTestId, data) {
        const test = await prisma.labTest.findUnique({ where: { id: parseId(labTestId) } });
        if (!test) throw new AppError('Test not found', 404);

        const parameter = await prisma.testParameter.create({
            data: {
                labTestId: parseId(labTestId),
                name: data.name,
                unit: data.unit,
                referenceRange: data.reference_range,
                minValue: data.min_value,
                maxValue: data.max_value,
                method: data.method,
                sortOrder: data.sort_order ?? 0,
                status: data.status || 'active',
            },
        });

        return serialize({
            ...parameter,
            test_id: parameter.labTestId,
            reference_range: parameter.referenceRange,
            min_value: parameter.minValue,
            max_value: parameter.maxValue,
            sort_order: parameter.sortOrder,
        });
    },

    async updateParameter(id, data) {
        const payload = {};
        const fieldMap = {
            name: 'name',
            unit: 'unit',
            reference_range: 'referenceRange',
            min_value: 'minValue',
            max_value: 'maxValue',
            method: 'method',
            sort_order: 'sortOrder',
            status: 'status',
        };

        Object.entries(fieldMap).forEach(([inputKey, prismaKey]) => {
            if (data[inputKey] !== undefined) payload[prismaKey] = data[inputKey];
        });

        try {
            const parameter = await prisma.testParameter.update({
                where: { id: parseId(id) },
                data: payload,
            });

            return serialize({
                ...parameter,
                test_id: parameter.labTestId,
                reference_range: parameter.referenceRange,
                min_value: parameter.minValue,
                max_value: parameter.maxValue,
                sort_order: parameter.sortOrder,
            });
        } catch {
            throw new AppError('Parameter not found', 404);
        }
    },

    async removeParameter(id) {
        try {
            await prisma.testParameter.delete({ where: { id: parseId(id) } });
        } catch {
            throw new AppError('Parameter not found', 404);
        }
    },

    async getParameter(id) {
        const parameter = await prisma.testParameter.findUnique({ where: { id: parseId(id) } });
        if (!parameter) throw new AppError('Parameter not found', 404);

        return serialize({
            ...parameter,
            test_id: parameter.labTestId,
            reference_range: parameter.referenceRange,
            min_value: parameter.minValue,
            max_value: parameter.maxValue,
            sort_order: parameter.sortOrder,
        });
    },
};
