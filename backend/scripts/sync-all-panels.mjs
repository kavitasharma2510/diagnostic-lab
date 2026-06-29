import '../src/config/env.js';
import { PrismaClient } from '@prisma/client';
import { GROUPED_PANELS, PANEL_PARAMETERS, PANEL_TEST_CATEGORIES } from '../src/constants/panelSequences.js';

const prisma = new PrismaClient();

async function ensurePanelCategory(panelKey) {
    const meta = PANEL_TEST_CATEGORIES[panelKey];
    if (!meta) return null;

    const existing = await prisma.testCategory.findFirst({
        where: { code: { equals: meta.code, mode: 'insensitive' } },
    });
    if (existing) {
        return prisma.testCategory.update({
            where: { id: existing.id },
            data: {
                name: meta.name,
                description: meta.description,
                status: 'active',
            },
        });
    }

    return prisma.testCategory.create({
        data: {
            code: meta.code,
            name: meta.name,
            description: meta.description,
            status: 'active',
        },
    });
}

async function syncPanel(panelKey) {
    const meta = GROUPED_PANELS[panelKey];
    const parameters = PANEL_PARAMETERS[panelKey];
    if (!meta || !parameters?.length) return;

    const category = await ensurePanelCategory(panelKey);
    if (!category) {
        console.warn(`Skip ${panelKey}: could not create category.`);
        return;
    }

    let labTest = await prisma.labTest.findFirst({
        where: {
            OR: [
                { code: meta.code },
                { name: { contains: meta.name.split('(')[0].trim(), mode: 'insensitive' }, reportType: 'grouped' },
            ],
        },
    });

    if (!labTest) {
        labTest = await prisma.labTest.create({
            data: {
                testCategoryId: category.id,
                name: meta.name,
                code: meta.code,
                sampleType: meta.sample_type,
                reportType: 'grouped',
                price: meta.price,
                method: meta.method,
                status: 'active',
            },
        });
        console.log(`Created grouped test: ${meta.name}`);
    } else {
        await prisma.labTest.update({
            where: { id: labTest.id },
            data: {
                testCategoryId: category.id,
                name: meta.name,
                code: meta.code,
                reportType: 'grouped',
                sampleType: meta.sample_type,
                method: meta.method,
                price: meta.price,
                status: 'active',
            },
        });
        console.log(`Updated grouped test: ${meta.name}`);
    }

    await prisma.testParameter.deleteMany({ where: { labTestId: labTest.id } });

    for (let i = 0; i < parameters.length; i++) {
        const p = parameters[i];
        await prisma.testParameter.create({
            data: {
                labTestId: labTest.id,
                name: p.name,
                unit: p.unit,
                referenceRange: p.reference_range,
                minValue: p.min_value ?? null,
                maxValue: p.max_value ?? null,
                method: p.method || meta.method,
                sortOrder: i,
                status: 'active',
            },
        });
    }

    let totalDeactivated = 0;
    for (const p of parameters) {
        const result = await prisma.labTest.updateMany({
            where: {
                testCategoryId: category.id,
                reportType: 'single',
                status: 'active',
                NOT: { id: labTest.id },
                name: { equals: p.name, mode: 'insensitive' },
            },
            data: { status: 'inactive' },
        });
        totalDeactivated += result.count;
    }

    console.log(`  Category: ${category.name} (${category.code})`);
    console.log(`  ${parameters.length} parameters synced${totalDeactivated ? `, ${totalDeactivated} duplicate singles deactivated` : ''}.`);
    parameters.forEach((p, i) => console.log(`    ${String(i + 1).padStart(2)}. ${p.name}`));
}

async function main() {
    console.log('Syncing panel categories and grouped tests...\n');
    for (const key of Object.keys(GROUPED_PANELS)) {
        console.log(`--- ${key} ---`);
        await syncPanel(key);
        console.log('');
    }
    console.log('Done. Categories: CBC, LFT, KFT, FBS, CRP with grouped tests.');
}

main()
    .catch((err) => {
        console.error(err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
