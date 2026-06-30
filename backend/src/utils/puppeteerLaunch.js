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
        '/usr/bin/google-chrome-stable',
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser',
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    ].filter(Boolean);
}

function buildLaunchOptions(executablePath) {
    return {
        headless: true,
        ...(executablePath ? { executablePath } : {}),
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--font-render-hinting=none',
            '--disable-extensions',
            '--disable-background-networking',
        ],
    };
}

async function launchFreshBrowser(puppeteer) {
    const launchOptions = buildLaunchOptions();

    try {
        return await puppeteer.launch(launchOptions);
    } catch (error) {
        const message = String(error?.message || error);
        if (!message.includes('Could not find Chrome')) {
            throw error;
        }

        for (const executablePath of systemChromePaths()) {
            if (fs.existsSync(executablePath)) {
                return puppeteer.launch(buildLaunchOptions(executablePath));
            }
        }

        throw new Error(
            'Chrome not found for PDF generation. Run: npm run browsers:install -w backend',
        );
    }
}

let sharedBrowser = null;
let sharedBrowserPromise = null;

export async function launchPuppeteer(puppeteer) {
    if (sharedBrowser?.connected) {
        return sharedBrowser;
    }

    if (!sharedBrowserPromise) {
        sharedBrowserPromise = launchFreshBrowser(puppeteer)
            .then((browser) => {
                sharedBrowser = browser;
                sharedBrowserPromise = null;
                browser.on('disconnected', () => {
                    sharedBrowser = null;
                });
                return browser;
            })
            .catch((err) => {
                sharedBrowserPromise = null;
                throw err;
            });
    }

    return sharedBrowserPromise;
}

export async function closePuppeteerBrowser() {
    if (sharedBrowser?.connected) {
        await sharedBrowser.close();
    }
    sharedBrowser = null;
    sharedBrowserPromise = null;
}
