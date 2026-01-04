import { chromium } from 'playwright';

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
    console.log('[Playwright] Fetching countries...');
    const browser = await chromium.launch({ headless: true });
    try {
        const page = await browser.newPage();
        await page.goto(DYNAMO_URL, { waitUntil: 'domcontentloaded' });

        const selectSelector = 'select[name="country"]';
        await page.waitForSelector(selectSelector);

        return await page.evaluate((selector) => {
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
    console.log(`[Playwright] Fetching cities for country: ${countryId}`);
    const browser = await chromium.launch({ headless: true });
    try {
        const page = await browser.newPage({
            extraHTTPHeaders: {
                'Referer': 'https://namazvakitleri.diyanet.gov.tr/tr-TR/',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        await page.goto(DYNAMO_URL, { waitUntil: 'domcontentloaded' });

        // Ensure dropdown exists before interacting
        await page.waitForSelector('select[name="country"]');

        // Setup response interceptor
        const responsePromise = page.waitForResponse(response =>
            response.url().includes('GetRegList') &&
            response.url().includes('ChangeType=country') &&
            response.status() === 200
        );

        // Trigger the request
        await page.selectOption('select[name="country"]', countryId);

        // Wait for JSON response
        const response = await responsePromise;
        const json = await response.json() as DiyanetResponse;

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
        console.error('[Playwright] City fetch failed:', error);
        throw new DiyanetError('Şehirler çekilemedi', 'FETCH_ERROR');
    } finally {
        await browser.close();
    }
}

export async function fetchDistricts(countryId: string, cityId: string): Promise<Country[]> {
    console.log(`[Playwright] Fetching districts for country: ${countryId}, city: ${cityId}`);
    const browser = await chromium.launch({ headless: true });
    try {
        const page = await browser.newPage();
        await page.goto(DYNAMO_URL, { waitUntil: 'domcontentloaded' });

        // Wait for main element
        await page.waitForSelector('select[name="country"]');

        // 1. Select Country (wait for its response to ensure state is ready)
        const countryResponse = page.waitForResponse(response =>
            response.url().includes('GetRegList') &&
            response.url().includes('ChangeType=country')
        ).catch(() => null);
        await page.selectOption('select[name="country"]', countryId);
        await countryResponse;

        // Wait for the city selector to populate (CRITICAL STEP)
        const citySelector = 'select[name="state"]';
        await page.waitForFunction((selector) => {
            const select = document.querySelector(selector) as HTMLSelectElement;
            return select && select.options.length > 1;
        }, citySelector, { timeout: 5000 }).catch(() => console.log('[Playwright] Timeout waiting for cities in fetchDistricts'));

        // Brief stabilization
        await page.waitForTimeout(200);

        // 2. Select City ...
        const cityResponsePromise = page.waitForResponse(response =>
            response.url().includes('GetRegList') &&
            response.url().includes('ChangeType=state')
            , { timeout: 2000 }); // Catching in the await block below

        await page.selectOption(citySelector, cityId);

        try {
            const response = await cityResponsePromise;
            const json = await response.json() as DiyanetResponse;

            if (json.StateRegionList && json.StateRegionList.length > 0) {
                return json.StateRegionList.map(item => ({
                    name: item.IlceAdi,
                    value: item.IlceID
                }));
            }
            return []; // Empty list in JSON means no districts
        } catch (e) {
            console.log('[Playwright] No district network response (2-level country).');
            return [];
        }

    } catch (error) {
        console.warn('[Playwright] District fetch error (likely 2-level country):', error);
        return [];
    } finally {
        await browser.close();
    }
}
