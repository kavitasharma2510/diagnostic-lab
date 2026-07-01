import './config/env.js';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import testCategoriesRouter from './routes/testCategories.routes.js';
import labTestsRouter from './routes/labTests.routes.js';
import parametersRouter from './routes/parameters.routes.js';
import profilesRouter from './routes/profiles.routes.js';
import patientsRouter from './routes/patients.routes.js';
import billsRouter from './routes/bills.routes.js';
import samplesRouter from './routes/samples.routes.js';
import reportsRouter from './routes/reports.routes.js';
import registrationsRouter from './routes/registrations.routes.js';
import { reportController } from './controllers/report.controller.js';
import { errorHandler, asyncHandler } from './middleware/errorHandler.js';
import { scheduleMonthlyDataCleanup } from './services/dataCleanup.service.js';
import { warmupPdfAssets } from './templates/reportPdfTemplate.js';
import { closePuppeteerBrowser } from './utils/puppeteerLaunch.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 5000;

function getAllowedOrigins() {
    const defaults = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'https://diagnostic-lab-client.vercel.app',
    ];

    if (!process.env.CLIENT_URL) {
        return defaults;
    }

    const fromEnv = process.env.CLIENT_URL
        .split(',')
        .map((url) => url.trim())
        .filter(Boolean);

    return [...new Set([...fromEnv, ...defaults])];
}

app.use(cors({
    origin: getAllowedOrigins(),
    credentials: true,
}));
app.use(express.json());

app.use('/reports', express.static(path.join(__dirname, '../public/reports')));

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', stack: 'MERN — MongoDB + Express + React' });
});

app.use('/api/test-categories', testCategoriesRouter);
app.use('/api/lab-tests', labTestsRouter);
app.use('/api/tests', labTestsRouter);
app.use('/api/parameters', parametersRouter);
app.use('/api/profiles', profilesRouter);
app.use('/api/patients', patientsRouter);
app.use('/api/bills', billsRouter);
app.use('/api/samples', samplesRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/registrations', registrationsRouter);

app.get('/report/download/:reportNo', asyncHandler(reportController.publicDownload));
app.get('/report/verify/:reportNo', asyncHandler(reportController.verify));

app.use(errorHandler);

app.listen(port, () => {
    console.log(`API running on http://localhost:${port}`);
    scheduleMonthlyDataCleanup();
    warmupPdfAssets().catch((err) => {
        console.warn('[pdf-warmup] Skipped:', err.message || err);
    });
});

for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, async () => {
        await closePuppeteerBrowser().catch(() => {});
        process.exit(0);
    });
}
