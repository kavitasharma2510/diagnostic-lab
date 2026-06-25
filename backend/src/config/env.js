import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootEnvPath = path.resolve(__dirname, '../../../.env');
const backendEnvPath = path.resolve(__dirname, '../../.env');

// Root .env first (your MONGO_URI), then backend/.env overrides
dotenv.config({ path: rootEnvPath });
dotenv.config({ path: backendEnvPath, override: true });

if (process.env.MONGO_URI) {
    process.env.MONGO_URI = process.env.MONGO_URI.trim();
}

const puppeteerCacheDir = path.resolve(__dirname, '../../.cache/puppeteer');
process.env.PUPPETEER_CACHE_DIR = puppeteerCacheDir;

if (!process.env.MONGO_URI?.startsWith('mongo')) {
    throw new Error(
        'MONGO_URI is missing or invalid. Set it in project root .env or backend/.env\n'
        + 'Example: MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/diagnostic_lab',
    );
}
