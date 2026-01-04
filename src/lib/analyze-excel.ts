
import { getBrowser } from './browser';

async function run() {
    console.log('--- Analyze Excel Download ---');
    const browser = await getBrowser();
    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Navigate directly to a valid page (Istanbul)
        const url = 'https://namazvakitleri.diyanet.gov.tr/tr-TR/9541/istanbul-icin-namaz-vakti';
        console.log(`Navigating to: ${url}`);
        await page.goto(url, { waitUntil: 'domcontentloaded' });

        // Monitor requests
        page.on('request', req => {
            const reqUrl = req.url();
            if (reqUrl.includes('GetPrayerTimes') || reqUrl.includes('namaz') || req.resourceType() === 'xhr' || req.resourceType() === 'fetch') {
                console.log('>> Request:', reqUrl);
            }
        });

        // Click "Yıllık" tab
        const clicked = await page.evaluate(() => {
            const elements = document.querySelectorAll('a, button');
            for (const el of elements) {
                if (el.textContent?.includes('Yıllık')) {
                    (el as HTMLElement).click();
                    return true;
                }
            }
            return false;
        });

        if (clicked) {
            console.log('Clicked "Yıllık" tab');
        } else {
            console.log('Could not find "Yıllık" tab');
        }

        // Wait for Excel button
        const excelSelector = 'button, a';
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Click Excel button
        const excelClicked = await page.evaluate(() => {
            const elements = document.querySelectorAll('button, a');
            for (const el of elements) {
                if (el.textContent?.includes('Excel')) {
                    console.log('Found Excel button');
                    (el as HTMLElement).click();
                    return true;
                }
            }
            return false;
        });

        if (excelClicked) {
            console.log('Clicked Excel button');
        } else {
            console.log('Could not find Excel button');
        }

        // Wait a bit for download to start
        await new Promise(resolve => setTimeout(resolve, 3000));

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await browser.close();
    }
}

run();
