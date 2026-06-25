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
import { reportController } from './controllers/report.controller.js';
import { errorHandler, asyncHandler } from './middleware/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
    origin: [
        process.env.CLIENT_URL || 'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3000',
    ],
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

app.get('/report/verify/:reportNo', asyncHandler(reportController.verify));

app.use(errorHandler);

app.listen(port, () => {
    console.log(`API running on http://localhost:${port}`);
});
