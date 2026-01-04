import { getBrowser } from './browser';

export interface Country {
    name: string;
    value: string;
    leaf?: boolean;
}

export interface PrayerTimes {
    imsak: string;
    gunes: string;
    ogle: string;
    ikindi: string;
    aksam: string;
    yatsi: string;
}

export interface PrayerData {
    districtId: string;
    sourceUrl: string;
    date: string;
    hijri: string;
    times: PrayerTimes;
}

interface ColumnMap {
    imsak: number;
    gunes: number;
    ogle: number;
    ikindi: number;
    aksam: number;
    yatsi: number;
}

const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export class DiyanetError extends Error {
    constructor(message: string, public code: 'FETCH_ERROR' | 'PARSE_ERROR' | 'NOT_FOUND' = 'FETCH_ERROR') {
        super(message);
        this.name = 'DiyanetError';
    }
}

const DYNAMO_URL = 'https://namazvakitleri.diyanet.gov.tr/tr-TR/';

export async function fetchCountries(): Promise<Country[]> {
    console.log('[Puppeteer] Fetching countries...');
    const browser = await getBrowser();
    try {
        const page = await browser.newPage();
        await page.setUserAgent(DEFAULT_USER_AGENT);
        await page.goto(DYNAMO_URL, { waitUntil: 'domcontentloaded' });

        const selectSelector = 'select[name="country"]';
        await page.waitForSelector(selectSelector);

        return await page.evaluate((selector: string) => {
            const select = document.querySelector(selector) as HTMLSelectElement;
            return Array.from(select.options)
                .map(opt => ({ name: opt.text.trim(), value: opt.value }))
                .filter(c => c.value && c.value !== '0');
        }, selectSelector);
    } finally {
        await browser.close();
    }
}

// Interfaces for the Diyanet Internal API Response
interface DiyanetState {
    SehirID: string;
    SehirAdi: string;
    SehirAdiEn: string;
}

interface DiyanetDistrict {
    IlceID: string;
    IlceAdi: string;
    IlceAdiEn: string;
}

interface DiyanetResponse {
    StateList?: DiyanetState[];
    StateRegionList?: DiyanetDistrict[];
    HasStateList?: boolean;
}

export async function fetchCities(countryId: string): Promise<Country[]> {
    console.log(`[Puppeteer] Fetching cities for country: ${countryId}`);
    const browser = await getBrowser();
    try {
        const page = await browser.newPage();
        await page.setUserAgent(DEFAULT_USER_AGENT);
        await page.setExtraHTTPHeaders({
            'Referer': 'https://namazvakitleri.diyanet.gov.tr/tr-TR/',
        });
        await page.goto(DYNAMO_URL, { waitUntil: 'domcontentloaded' });

        // Ensure dropdown exists before interacting
        await page.waitForSelector('select[name="country"]');

        // Setup response interceptor
        const responsePromise = new Promise<DiyanetResponse>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Response timeout')), 10000);
            page.on('response', async (response) => {
                if (response.url().includes('GetRegList') &&
                    response.url().includes('ChangeType=country') &&
                    response.status() === 200) {
                    clearTimeout(timeout);
                    try {
                        const json = await response.json();
                        resolve(json as DiyanetResponse);
                    } catch (e) {
                        reject(e);
                    }
                }
            });
        });

        // Trigger the request
        await page.select('select[name="country"]', countryId);

        // Wait for JSON response
        const json = await responsePromise;

        // Logic for countries like Tunisia where HasStateList is false
        // In these cases, the "Cities" are returned in StateRegionList
        if (json.HasStateList === false && json.StateRegionList && json.StateRegionList.length > 0) {
            return json.StateRegionList.map(item => ({
                name: item.IlceAdi,
                value: item.IlceID,
                leaf: true
            }));
        }

        if (json.StateList && json.StateList.length > 0) {
            return json.StateList.map(item => ({
                name: item.SehirAdi,
                value: item.SehirID
            }));
        }

        return [];

    } catch (error) {
        console.error('[Puppeteer] City fetch failed:', error);
        throw new DiyanetError('Şehirler çekilemedi', 'FETCH_ERROR');
    } finally {
        await browser.close();
    }
}

export async function fetchDistricts(countryId: string, cityId: string): Promise<Country[]> {
    console.log(`[Puppeteer] Fetching districts for country: ${countryId}, city: ${cityId}`);
    const browser = await getBrowser();
    try {
        const page = await browser.newPage();
        await page.setUserAgent(DEFAULT_USER_AGENT);
        await page.goto(DYNAMO_URL, { waitUntil: 'domcontentloaded' });

        // Wait for main element
        await page.waitForSelector('select[name="country"]');

        // 1. Select Country and wait for its response
        let countryResponseReceived = false;
        const countryListener = async (response: any) => {
            if (response.url().includes('GetRegList') &&
                response.url().includes('ChangeType=country')) {
                countryResponseReceived = true;
            }
        };
        page.on('response', countryListener);

        await page.select('select[name="country"]', countryId);

        // Wait briefly for country response
        await new Promise(resolve => setTimeout(resolve, 1500));
        page.off('response', countryListener);

        // Wait for the city selector to populate
        const citySelector = 'select[name="state"]';
        try {
            await page.waitForFunction((selector: string) => {
                const select = document.querySelector(selector) as HTMLSelectElement;
                return select && select.options.length > 1;
            }, { timeout: 5000 }, citySelector);
        } catch (e) {
            console.log('[Puppeteer] Timeout waiting for cities in fetchDistricts');
        }

        // Brief stabilization
        await new Promise(resolve => setTimeout(resolve, 200));

        // 2. Select City and capture response
        const districtResponsePromise = new Promise<DiyanetResponse | null>((resolve) => {
            const timeout = setTimeout(() => resolve(null), 2000);
            page.on('response', async (response) => {
                if (response.url().includes('GetRegList') &&
                    response.url().includes('ChangeType=state') &&
                    response.status() === 200) {
                    clearTimeout(timeout);
                    try {
                        const json = await response.json();
                        resolve(json as DiyanetResponse);
                    } catch (e) {
                        resolve(null);
                    }
                }
            });
        });

        await page.select(citySelector, cityId);

        const json = await districtResponsePromise;

        if (json && json.StateRegionList && json.StateRegionList.length > 0) {
            return json.StateRegionList.map(item => ({
                name: item.IlceAdi,
                value: item.IlceID
            }));
        }

        return []; // Empty list in JSON means no districts

    } catch (error) {
        console.warn('[Puppeteer] District fetch error (likely 2-level country):', error);
        return [];
    } finally {
        await browser.close();
    }
}
