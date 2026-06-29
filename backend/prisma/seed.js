import '../src/config/env.js';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { GROUPED_PANELS, PANEL_PARAMETERS, PANEL_TEST_CATEGORIES } from '../src/constants/panelSequences.js';

const prisma = new PrismaClient();

async function upsertCategory({ name, code, description }) {
    return prisma.testCategory.upsert({
        where: { code },
        update: { name, description },
        create: { name, code, description, status: 'active' },
    });
}

async function seedGroupedTest(categoryId, panelKey) {
    const meta = GROUPED_PANELS[panelKey];
    const parameters = PANEL_PARAMETERS[panelKey];
    if (!meta || !parameters?.length) return null;

    await prisma.testParameter.deleteMany({
        where: { labTest: { code: meta.code } },
    });
    await prisma.labTest.deleteMany({ where: { code: meta.code } });

    return prisma.labTest.create({
        data: {
            testCategoryId: categoryId,
            name: meta.name,
            code: meta.code,
            sampleType: meta.sample_type,
            reportType: 'grouped',
            price: meta.price,
            method: meta.method,
            status: 'active',
            parameters: {
                create: parameters.map((p, index) => ({
                    name: p.name,
                    unit: p.unit,
                    referenceRange: p.reference_range,
                    minValue: p.min_value ?? null,
                    maxValue: p.max_value ?? null,
                    method: p.method || meta.method,
                    sortOrder: index,
                    status: 'active',
                })),
            },
        },
    });
}

async function seedSingleTest(categoryId, testData) {
    const exists = await prisma.labTest.findUnique({ where: { code: testData.code } });
    if (exists) return exists;

    return prisma.labTest.create({
        data: {
            testCategoryId: categoryId,
            name: testData.name,
            code: testData.code,
            sampleType: testData.sample_type,
            reportType: 'single',
            unit: testData.unit,
            price: testData.price,
            method: testData.method,
            referenceRange: testData.reference_range,
            minValue: testData.min_value,
            maxValue: testData.max_value,
            status: 'active',
        },
    });
}

async function main() {
    const password = await bcrypt.hash('password123', 10);

    await prisma.user.upsert({
        where: { email: 'admin@diagnosticlab.com' },
        update: {},
        create: {
            name: 'Lab Admin',
            email: 'admin@diagnosticlab.com',
            password,
            role: 'admin',
            status: 'active',
        },
    });

    const hem = await upsertCategory({ name: 'Hematology', code: 'HEM', description: 'Blood cell studies' });
    const bio = await upsertCategory({ name: 'Biochemistry', code: 'BIO', description: 'Clinical chemistry' });
    const thy = await upsertCategory({ name: 'Thyroid', code: 'THY', description: 'Thyroid function' });
    const ser = await upsertCategory({ name: 'Serology', code: 'SER', description: 'Viral and inflammatory markers' });
    const lip = await upsertCategory({ name: 'Lipid Studies', code: 'LIP', description: 'Lipid profile' });

    for (const panelKey of Object.keys(PANEL_TEST_CATEGORIES)) {
        const cat = PANEL_TEST_CATEGORIES[panelKey];
        await upsertCategory({ name: cat.name, code: cat.code, description: cat.description });
    }

    for (const panelKey of ['CBC', 'LFT', 'KFT', 'FBS', 'CRP']) {
        const cat = await prisma.testCategory.findUnique({ where: { code: panelKey } });
        if (cat) await seedGroupedTest(cat.id, panelKey);
    }

    await prisma.testParameter.deleteMany({ where: { labTest: { code: 'LIPID' } } });
    await prisma.labTest.deleteMany({ where: { code: 'LIPID' } });
    await prisma.labTest.create({
        data: {
            testCategoryId: lip.id,
            name: 'Lipid Profile',
            code: 'LIPID',
            sampleType: 'Serum',
            reportType: 'grouped',
            price: 550,
            method: 'Enzymatic Colorimetric',
            status: 'active',
            parameters: {
                create: [
                    { name: 'Total Cholesterol', unit: 'mg/dL', referenceRange: '< 200', maxValue: 200, sortOrder: 0, status: 'active' },
                    { name: 'HDL Cholesterol', unit: 'mg/dL', referenceRange: '> 40', minValue: 40, sortOrder: 1, status: 'active' },
                    { name: 'Triglycerides', unit: 'mg/dL', referenceRange: '< 150', maxValue: 150, sortOrder: 2, status: 'active' },
                ],
            },
        },
    });

    for (const test of [
        { code: 'T3', name: 'Triiodothyronine (T3)', sample_type: 'Serum', unit: 'ng/dL', price: 250, method: 'CLIA', reference_range: '80 - 200', min_value: 80, max_value: 200, cat: thy.id },
        { code: 'T4', name: 'Thyroxine (T4)', sample_type: 'Serum', unit: 'µg/dL', price: 250, method: 'CLIA', reference_range: '4.5 - 12.0', min_value: 4.5, max_value: 12, cat: thy.id },
        { code: 'TSH', name: 'Thyroid Stimulating Hormone (TSH)', sample_type: 'Serum', unit: 'µIU/mL', price: 300, method: 'CLIA', reference_range: '0.4 - 4.0', min_value: 0.4, max_value: 4, cat: thy.id },
        { code: 'HBSAG', name: 'HBsAg', sample_type: 'Serum', price: 400, method: 'ELISA', reference_range: 'Non-Reactive', cat: ser.id },
        { code: 'ANTI_HCV', name: 'Anti-HCV', sample_type: 'Serum', price: 450, method: 'ELISA', reference_range: 'Non-Reactive', cat: ser.id },
        { code: 'HIV', name: 'HIV I & II', sample_type: 'Serum', price: 500, method: 'ELISA', reference_range: 'Non-Reactive', cat: ser.id },
    ]) {
        await seedSingleTest(test.cat, test);
    }

    const profileDefs = [
        { name: 'Thyroid Profile', code: 'THYROID_PROFILE', price: 700, testCodes: ['T3', 'T4', 'TSH'] },
        { name: 'Viral Marker Panel', code: 'VIRAL_MARKER', price: 1200, testCodes: ['HBSAG', 'ANTI_HCV', 'HIV'] },
        { name: 'Executive Health Package', code: 'EXEC_HEALTH', price: 1800, testCodes: ['CBC', 'LFT', 'KFT', 'LIPID'] },
        { name: 'Diabetes Screening', code: 'DIABETES_SCREEN', price: 500, testCodes: ['FBS'] },
        { name: 'Inflammation Panel', code: 'INFLAMMATION', price: 450, testCodes: ['CRP'] },
    ];

    for (const profileDef of profileDefs) {
        const existing = await prisma.profile.findUnique({ where: { code: profileDef.code } });
        if (existing) continue;

        const tests = await prisma.labTest.findMany({ where: { code: { in: profileDef.testCodes } } });
        await prisma.profile.create({
            data: {
                name: profileDef.name,
                code: profileDef.code,
                price: profileDef.price,
                description: profileDef.name,
                status: 'active',
                items: {
                    create: tests.map((test, index) => ({
                        labTestId: test.id,
                        sortOrder: index,
                    })),
                },
            },
        });
    }

    const admin = await prisma.user.findUnique({ where: { email: 'admin@diagnosticlab.com' } });

    const patient1 = await prisma.patient.upsert({
        where: { patientNo: 'PAT-0001' },
        update: {},
        create: {
            patientNo: 'PAT-0001',
            name: 'Rahul Sharma',
            mobile: '9876543210',
            gender: 'Male',
            age: 34,
            address: 'Delhi',
        },
    });

    const patient2 = await prisma.patient.upsert({
        where: { patientNo: 'PAT-0002' },
        update: {},
        create: {
            patientNo: 'PAT-0002',
            name: 'Priya Verma',
            mobile: '9123456780',
            gender: 'Female',
            age: 28,
            address: 'Noida',
        },
    });

    const cbc = await prisma.labTest.findUnique({ where: { code: 'CBC' } });
    const lft = await prisma.labTest.findUnique({ where: { code: 'LFT' } });
    const hbsag = await prisma.labTest.findUnique({ where: { code: 'HBSAG' } });
    const tsh = await prisma.labTest.findUnique({ where: { code: 'TSH' } });

    const billSeed = [
        {
            billNo: 'BILL-2026-0001',
            patientId: patient1.id,
            referredDoctor: 'Dr. Amit Singh',
            tests: [
                { labTest: cbc, name: cbc?.name, price: cbc?.price },
                { labTest: lft, name: lft?.name, price: lft?.price },
            ],
        },
        {
            billNo: 'BILL-2026-0002',
            patientId: patient2.id,
            referredDoctor: 'Dr. Neha Gupta',
            tests: [
                { labTest: hbsag, name: hbsag?.name, price: hbsag?.price },
                { labTest: tsh, name: tsh?.name, price: tsh?.price },
            ],
        },
    ];

    for (const billData of billSeed) {
        const exists = await prisma.bill.findUnique({ where: { billNo: billData.billNo } });
        if (exists) continue;

        const total = billData.tests.reduce((sum, t) => sum + Number(t.price || 0), 0);

        await prisma.bill.create({
            data: {
                billNo: billData.billNo,
                patientId: billData.patientId,
                referredDoctor: billData.referredDoctor,
                totalAmount: total,
                paymentStatus: 'Unpaid',
                status: 'open',
                createdById: admin?.id,
                billTests: {
                    create: billData.tests
                        .filter((t) => t.labTest)
                        .map((t) => ({
                            labTestId: t.labTest.id,
                            testName: t.name,
                            price: t.price,
                            status: 'Pending Sample',
                        })),
                },
            },
        });
    }

    // Auto-collect samples for BILL-2026-0001 (demo flow for result entry)
    const demoBill = await prisma.bill.findUnique({
        where: { billNo: 'BILL-2026-0001' },
        include: { billTests: { include: { labTest: true } } },
    });

    if (demoBill && !(await prisma.sample.findFirst({ where: { billId: demoBill.id } }))) {
        const grouped = {};
        for (const bt of demoBill.billTests) {
            const sampleType = bt.labTest?.sampleType || 'Blood';
            if (!grouped[sampleType]) grouped[sampleType] = [];
            grouped[sampleType].push(bt);
        }

        let seq = 1;
        for (const [sampleType, tests] of Object.entries(grouped)) {
            const sampleNo = `SMP-20260625-${String(seq).padStart(4, '0')}`;
            const barcode = `20260625${String(seq).padStart(5, '0')}`;
            seq += 1;

            const sample = await prisma.sample.create({
                data: {
                    billId: demoBill.id,
                    patientId: demoBill.patientId,
                    sampleNo,
                    barcode,
                    sampleType,
                    status: 'collected',
                    collectedById: admin?.id,
                    collectedAt: new Date(),
                },
            });

            for (const bt of tests) {
                await prisma.sampleTest.create({
                    data: {
                        sampleId: sample.id,
                        billTestId: bt.id,
                        labTestId: bt.labTestId,
                        status: 'collected',
                    },
                });
                await prisma.billTest.update({ where: { id: bt.id }, data: { status: 'collected' } });
            }
        }
    }

    console.log('Seed completed: categories, tests, profiles, patients, bills, demo samples, admin user.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
