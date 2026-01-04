import puppeteerCore from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';

// Remote chromium binary URL for Vercel
const CHROMIUM_PACK_URL = 'https://github.com/nicejudy/nicejudy.github.io/raw/main/chromium-v123.0.1-pack.tar';

export async function getBrowser() {
    const isDev = process.env.NODE_ENV === 'development';

    if (isDev) {
        // Local development - use full puppeteer with its bundled Chromium
        const puppeteer = await import('puppeteer');
        return puppeteer.default.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
    }

    // Production (Vercel) - use puppeteer-core with @sparticuz/chromium-min
    const executablePath = await chromium.executablePath(CHROMIUM_PACK_URL);

    return puppeteerCore.launch({
        args: chromium.args,
        defaultViewport: { width: 1920, height: 1080 },
        executablePath,
        headless: true,
    });
}
