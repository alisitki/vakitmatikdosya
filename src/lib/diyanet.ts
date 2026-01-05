import { promises as fs } from 'fs';
import path from 'path';

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

export class DiyanetError extends Error {
    constructor(message: string, public code: 'FETCH_ERROR' | 'PARSE_ERROR' | 'NOT_FOUND' = 'FETCH_ERROR') {
        super(message);
        this.name = 'DiyanetError';
    }
}

// Get the base path for download files
function getDownloadBasePath(): string {
    return path.join(process.cwd(), 'public', 'download');
}

/**
 * Fetches available countries from the filesystem.
 * Scans subdirectories in public/download
 */
export async function fetchCountries(): Promise<Country[]> {
    console.log('[Filesystem] Fetching countries...');
    const basePath = getDownloadBasePath();

    try {
        const entries = await fs.readdir(basePath, { withFileTypes: true });
        const countries = entries
            .filter(entry => entry.isDirectory() && !entry.name.startsWith('.'))
            .map(entry => ({
                name: entry.name,
                value: entry.name
            }));

        console.log(`[Filesystem] Found ${countries.length} countries`);
        return countries;
    } catch (error) {
        console.error('[Filesystem] Error reading countries:', error);
        throw new DiyanetError('Ülkeler okunamadı', 'FETCH_ERROR');
    }
}

/**
 * Fetches cities for a country from the filesystem.
 * Scans subdirectories in public/download/{countryId}
 * Auto-detects 2-layer vs 3-layer structure
 */
export async function fetchCities(countryId: string): Promise<Country[]> {
    console.log(`[Filesystem] Fetching cities for country: ${countryId}`);
    const countryPath = path.join(getDownloadBasePath(), countryId);

    try {
        const entries = await fs.readdir(countryPath, { withFileTypes: true });

        const directories = entries.filter(entry =>
            entry.isDirectory() && !entry.name.startsWith('.')
        );
        const txtFiles = entries.filter(entry =>
            entry.isFile() && entry.name.endsWith('.txt')
        );

        if (directories.length > 0) {
            // 3-layer structure: return directories as cities
            const cities = directories.map(entry => ({
                name: entry.name,
                value: entry.name
            }));
            console.log(`[Filesystem] Found ${cities.length} cities (3-layer structure)`);
            return cities;
        } else if (txtFiles.length > 0) {
            // 2-layer structure: txt files are the final destinations
            const cities = txtFiles.map(entry => {
                const name = entry.name.replace('.txt', '');
                return {
                    name: name,
                    value: name,
                    leaf: true
                };
            });
            console.log(`[Filesystem] Found ${cities.length} locations (2-layer structure)`);
            return cities;
        }

        return [];
    } catch (error) {
        console.error('[Filesystem] Error reading cities:', error);
        throw new DiyanetError('Şehirler okunamadı', 'FETCH_ERROR');
    }
}

/**
 * Fetches districts for a city from the filesystem.
 * Scans .txt files in public/download/{countryId}/{cityId}
 */
export async function fetchDistricts(countryId: string, cityId: string): Promise<Country[]> {
    console.log(`[Filesystem] Fetching districts for country: ${countryId}, city: ${cityId}`);
    const cityPath = path.join(getDownloadBasePath(), countryId, cityId);

    try {
        const entries = await fs.readdir(cityPath, { withFileTypes: true });

        const districts = entries
            .filter(entry => entry.isFile() && entry.name.endsWith('.txt'))
            .map(entry => {
                const name = entry.name.replace('.txt', '');
                return {
                    name: name,
                    value: name
                };
            });

        console.log(`[Filesystem] Found ${districts.length} districts`);
        return districts;
    } catch (error) {
        console.error('[Filesystem] Error reading districts:', error);
        return [];
    }
}

/**
 * Gets the file path for a specific location's prayer times file
 */
export function getPrayerFilePath(countryId: string, cityId: string, districtId?: string): string {
    if (districtId) {
        return path.join(getDownloadBasePath(), countryId, cityId, `${districtId}.txt`);
    } else {
        return path.join(getDownloadBasePath(), countryId, `${cityId}.txt`);
    }
}
