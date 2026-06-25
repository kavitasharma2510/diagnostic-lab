import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { buildPagination, paginatedResponse } from '../utils/pagination.js';
import { serialize } from '../utils/serialize.js';
import { parseId } from '../utils/parseId.js';

function mapProfile(profile) {
    const tests = profile.items?.map((item) => ({
        ...serialize(item.labTest),
        sort_order: item.sortOrder,
        sample_type: item.labTest.sampleType,
        report_type: item.labTest.reportType,
    })) ?? [];

    return serialize({
        ...profile,
        tests_count: profile._count?.items ?? profile.items?.length ?? 0,
        items: profile.items?.map((item) => ({
            id: item.id,
            profile_id: item.profileId,
            test_id: item.labTestId,
            lab_test_id: item.labTestId,
            sort_order: item.sortOrder,
            test: serialize({
                ...item.labTest,
                sample_type: item.labTest.sampleType,
                report_type: item.labTest.reportType,
            }),
        })),
        tests,
    });
}

export const profileService = {
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

        const [total, rows] = await prisma.$transaction([
            prisma.profile.count({ where }),
            prisma.profile.findMany({
                where,
                skip,
                take: limit,
                orderBy: { name: 'asc' },
                include: { _count: { select: { items: true } } },
            }),
        ]);

        return paginatedResponse(
            rows.map((row) => serialize({ ...row, tests_count: row._count.items })),
            total,
            currentPage,
            limit
        );
    },

    async getById(id) {
        const profile = await prisma.profile.findUnique({
            where: { id: parseId(id) },
            include: {
                items: {
                    orderBy: { sortOrder: 'asc' },
                    include: { labTest: { include: { category: true, parameters: true } } },
                },
                _count: { select: { items: true } },
            },
        });

        if (!profile) {
            throw new AppError('Profile not found', 404);
        }

        return mapProfile(profile);
    },

    async create(data) {
        const profile = await prisma.$transaction(async (tx) => {
            const created = await tx.profile.create({
                data: {
                    name: data.name,
                    code: data.code,
                    price: data.price,
                    description: data.description,
                    status: data.status || 'active',
                },
            });

            if (data.test_ids?.length) {
                await this._syncItemsTx(tx, created.id, data.test_ids);
            }

            return tx.profile.findUnique({
                where: { id: created.id },
                include: {
                    items: {
                        orderBy: { sortOrder: 'asc' },
                        include: { labTest: true },
                    },
                    _count: { select: { items: true } },
                },
            });
        });

        return mapProfile(profile);
    },

    async update(id, data) {
        await prisma.$transaction(async (tx) => {
            const payload = {};
            ['name', 'code', 'price', 'description', 'status'].forEach((field) => {
                if (data[field] !== undefined) payload[field] = data[field];
            });

            if (Object.keys(payload).length) {
                await tx.profile.update({ where: { id: parseId(id) }, data: payload });
            }

            if (data.test_ids) {
                await this._syncItemsTx(tx, parseId(id), data.test_ids);
            }
        });

        return this.getById(id);
    },

    async remove(id) {
        try {
            await prisma.$transaction([
                prisma.profileTestItem.deleteMany({ where: { profileId: parseId(id) } }),
                prisma.profile.delete({ where: { id: parseId(id) } }),
            ]);
        } catch {
            throw new AppError('Profile not found', 404);
        }
    },

    async syncTests(id, tests) {
        const testIds = tests.map((t) => t.test_id);

        if (testIds.length !== new Set(testIds).size) {
            throw new AppError('Duplicate tests are not allowed in a profile.', 422, {
                tests: ['Duplicate tests are not allowed in a profile.'],
            });
        }

        await prisma.$transaction(async (tx) => {
            await tx.profileTestItem.deleteMany({ where: { profileId: parseId(id) } });

            for (const [index, item] of tests.entries()) {
                await tx.profileTestItem.create({
                    data: {
                        profileId: parseId(id),
                        labTestId: item.test_id,
                        sortOrder: item.sort_order ?? index,
                    },
                });
            }
        });

        return this.getById(id);
    },

    async _syncItemsTx(tx, profileId, testIds) {
        const uniqueIds = [...new Set(testIds)];

        if (uniqueIds.length !== testIds.length) {
            throw new AppError('Duplicate tests are not allowed in a profile.', 422, {
                tests: ['Duplicate tests are not allowed in a profile.'],
            });
        }

        await tx.profileTestItem.deleteMany({ where: { profileId } });

        for (const [index, labTestId] of testIds.entries()) {
            await tx.profileTestItem.create({
                data: {
                    profileId,
                    labTestId,
                    sortOrder: index,
                },
            });
        }
    },
};
