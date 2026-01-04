import { PrayerData } from './diyanet';

export function renderTemplate(template: string, data: PrayerData): string {
    let output = template;

    // Map of placeholders to values
    const replacements: Record<string, string> = {
        '{{date}}': data.date,
        '{{hijri}}': data.hijri,
        '{{imsak}}': data.times.imsak,
        '{{gunes}}': data.times.gunes,
        '{{ogle}}': data.times.ogle,
        '{{ikindi}}': data.times.ikindi,
        '{{aksam}}': data.times.aksam,
        '{{yatsi}}': data.times.yatsi,
        '{{city}}': data.districtId, // Using districtId as proxy for now
    };

    // Replace all occurrences
    for (const [key, value] of Object.entries(replacements)) {
        // Escape special regex chars in key if any ({{}})
        const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedKey, 'g');
        output = output.replace(regex, value);
    }

    return output;
}
