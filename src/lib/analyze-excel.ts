
import { chromium } from 'playwright';

async function run() {
    console.log('--- Analyze Excel Download ---');
    const browser = await chromium.launch({ headless: true });
    try {
        const page = await browser.newPage({
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });

        // Navigate directly to a valid page (Istanbul)
        const url = 'https://namazvakitleri.diyanet.gov.tr/tr-TR/9541/istanbul-icin-namaz-vakti';
        console.log(`Navigating to: ${url}`);
        await page.goto(url, { waitUntil: 'domcontentloaded' });

        // Monitor requests
        page.on('request', req => {
            if (req.url().includes('GetPrayerTimes') || req.url().includes('namaz') || req.resourceType() === 'xhr' || req.resourceType() === 'fetch') {
                console.log('>> Request:', req.url());
            }
        });

        const tabSelector = 'a:has-text("Yıllık"), button:has-text("Yıllık")';
        await page.waitForSelector(tabSelector, { timeout: 10000 });

        console.log('Clicking "Yıllık"...');
        const responsePromise = page.waitForResponse(resp => resp.status() === 200 && (resp.url().includes('Prayer') || resp.url().includes('vakit')), { timeout: 5000 }).catch(() => null);

        await page.click(tabSelector);

        const response = await responsePromise;
        if (response) {
            console.log('Intercepted Potential Data Response:', response.url());
            try {
                const json = await response.json();
                console.log('Response is JSON. Keys:', Object.keys(json));
                // console.log('Sample Data:', JSON.stringify(json).substring(0, 200));
            } catch (e) {
                console.log('Response is not JSON.');
            }
        }

        // Wait for Excel button
        const excelSelector = 'a:has-text("Excel"), button:has-text("Excel"), .excel-export';
        // Note: Class name is a guess, using text is safer
        await page.waitForSelector(excelSelector, { timeout: 10000 });

        // Get the href or on-click action
        const excelBtn = await page.$(excelSelector);
        if (excelBtn) {
            const href = await excelBtn.getAttribute('href');
            console.log('Excel Button Href:', href);

            // Should also intercept the request if it's a click
            const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
            const requestPromise = page.waitForRequest(req => req.url().includes('Excel') || req.url().includes('Export'), { timeout: 5000 }).catch(() => null);

            await excelBtn.click();

            const request = await requestPromise;
            if (request) {
                console.log('Intercepted Request URL:', request.url());
                console.log('Method:', request.method());
                console.log('Headers:', await request.allHeaders());
            } else {
                console.log('No request intercepted immediately.');
            }

            const download = await downloadPromise;
            if (download) {
                console.log('Download started for:', download.suggestedFilename());
                console.log('Download URL:', download.url());
            }
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await browser.close();
    }
}

run();
