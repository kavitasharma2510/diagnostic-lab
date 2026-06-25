import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cacheDir = path.resolve(__dirname, '../.cache/puppeteer');
process.env.PUPPETEER_CACHE_DIR = cacheDir;
fs.mkdirSync(cacheDir, { recursive: true });

const puppeteer = (await import('puppeteer')).default;

function chromeReady() {
    try {
        const executablePath = puppeteer.executablePath();
        return fs.existsSync(executablePath);
    } catch {
        return false;
    }
}

if (chromeReady()) {
    console.log(`Puppeteer Chrome is already installed (${cacheDir}).`);
    process.exit(0);
}

console.log(`Installing Puppeteer Chrome to ${cacheDir}...`);
execSync('npx puppeteer browsers install chrome', {
    stdio: 'inherit',
    env: { ...process.env, PUPPETEER_CACHE_DIR: cacheDir },
});

if (!chromeReady()) {
    console.warn('Puppeteer Chrome install finished but binary was not found. PDF generation may use system Chrome if installed.');
} else {
    console.log('Puppeteer Chrome installed successfully.');
}
