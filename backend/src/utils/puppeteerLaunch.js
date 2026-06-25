import fs from 'fs';
import path from 'path';

function systemChromePaths() {
    return [
        process.env.PUPPETEER_EXECUTABLE_PATH,
        process.env.CHROME_PATH,
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
        path.join(process.env.PROGRAMFILES || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
        path.join(process.env['PROGRAMFILES(X86)'] || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
        '/usr/bin/google-chrome',
        '/usr/bin/chromium-browser',
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    ].filter(Boolean);
}

export async function launchPuppeteer(puppeteer) {
    const launchOptions = {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    };

    try {
        return await puppeteer.launch(launchOptions);
    } catch (error) {
        const message = String(error?.message || error);
        if (!message.includes('Could not find Chrome')) {
            throw error;
        }

        for (const executablePath of systemChromePaths()) {
            if (fs.existsSync(executablePath)) {
                return puppeteer.launch({ ...launchOptions, executablePath });
            }
        }

        throw new Error(
            'Chrome not found for PDF generation. Run: npm run browsers:install -w backend',
        );
    }
}
