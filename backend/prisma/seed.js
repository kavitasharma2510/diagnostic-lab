import '../src/config/env.js';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function upsertCategory({ name, code, description }) {
    return prisma.testCategory.upsert({
        where: { code },
        update: { name, description },
        create: { name, code, description, status: 'active' },
    });
}

async function seedGroupedTest(categoryId, testData) {
    await prisma.testParameter.deleteMany({
        where: { labTest: { code: testData.code } },
    });
    await prisma.labTest.deleteMany({ where: { code: testData.code } });

    return prisma.labTest.create({
        data: {
            testCategoryId: categoryId,
            name: testData.name,
            code: testData.code,
            sampleType: testData.sample_type,
            reportType: 'grouped',
            price: testData.price,
            method: testData.method,
            status: 'active',
            parameters: {
                create: testData.parameters.map((p, index) => ({
                    name: p.name,
                    unit: p.unit,
                    referenceRange: p.reference_range,
                    minValue: p.min_value,
                    maxValue: p.max_value,
                    method: p.method || testData.method,
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
    const ser = await upsertCategory({ name: 'Serology', code: 'SER', description: 'Viral markers' });
    const lip = await upsertCategory({ name: 'Lipid Studies', code: 'LIP', description: 'Lipid profile' });

    await seedGroupedTest(hem.id, {
        name: 'Complete Blood Count (CBC)',
        code: 'CBC',
        sample_type: 'EDTA Blood',
        price: 350,
        method: 'Automated Hematology Analyzer',
        parameters: [
            { name: 'Haemoglobin', unit: 'g/dL', reference_range: '13.0 - 17.0', min_value: 13, max_value: 17 },
            { name: 'RBC Count', unit: 'million/cumm', reference_range: '4.5 - 5.5', min_value: 4.5, max_value: 5.5 },
            { name: 'WBC Count', unit: '/cumm', reference_range: '4000 - 11000', min_value: 4000, max_value: 11000 },
            { name: 'Platelet Count', unit: '/cumm', reference_range: '150000 - 450000', min_value: 150000, max_value: 450000 },
            { name: 'PCV', unit: '%', reference_range: '40 - 50', min_value: 40, max_value: 50 },
            { name: 'MCV', unit: 'fL', reference_range: '80 - 100', min_value: 80, max_value: 100 },
            { name: 'MCH', unit: 'pg', reference_range: '27 - 32', min_value: 27, max_value: 32 },
            { name: 'MCHC', unit: 'g/dL', reference_range: '32 - 36', min_value: 32, max_value: 36 },
        ],
    });

    await seedGroupedTest(bio.id, {
        name: 'Liver Function Test (LFT)',
        code: 'LFT',
        sample_type: 'Serum',
        price: 600,
        method: 'Photometry',
        parameters: [
            { name: 'SGOT (AST)', unit: 'U/L', reference_range: '0 - 40', min_value: 0, max_value: 40 },
            { name: 'SGPT (ALT)', unit: 'U/L', reference_range: '0 - 41', min_value: 0, max_value: 41 },
            { name: 'Alkaline Phosphatase', unit: 'U/L', reference_range: '44 - 147', min_value: 44, max_value: 147 },
            { name: 'Bilirubin Total', unit: 'mg/dL', reference_range: '0.1 - 1.2', min_value: 0.1, max_value: 1.2 },
        ],
    });

    await seedGroupedTest(bio.id, {
        name: 'Kidney Function Test (KFT)',
        code: 'KFT',
        sample_type: 'Serum',
        price: 500,
        method: 'Photometry',
        parameters: [
            { name: 'Blood Urea', unit: 'mg/dL', reference_range: '15 - 40', min_value: 15, max_value: 40 },
            { name: 'Serum Creatinine', unit: 'mg/dL', reference_range: '0.6 - 1.3', min_value: 0.6, max_value: 1.3 },
            { name: 'Uric Acid', unit: 'mg/dL', reference_range: '3.5 - 7.2', min_value: 3.5, max_value: 7.2 },
        ],
    });

    await seedGroupedTest(lip.id, {
        name: 'Lipid Profile',
        code: 'LIPID',
        sample_type: 'Serum',
        price: 550,
        method: 'Enzymatic Colorimetric',
        parameters: [
            { name: 'Total Cholesterol', unit: 'mg/dL', reference_range: '< 200', max_value: 200 },
            { name: 'HDL Cholesterol', unit: 'mg/dL', reference_range: '> 40', min_value: 40 },
            { name: 'Triglycerides', unit: 'mg/dL', reference_range: '< 150', max_value: 150 },
        ],
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
