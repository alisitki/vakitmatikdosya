
import { describe, it, expect, beforeAll } from 'vitest';
import { parseDiyanetHtml } from './diyanet';
import fs from 'fs';
import path from 'path';

describe('Diyanet Parser', () => {
    let html: string;

    beforeAll(() => {
        const fixturePath = path.join(__dirname, 'fixture.html');
        if (!fs.existsSync(fixturePath)) {
            throw new Error('Fixture file not found: run curl command first');
        }
        html = fs.readFileSync(fixturePath, 'utf-8');
    });

    it('should parse prayer times correctly from fixture', () => {
        // This expects the fixture to answer for "Gebze" or similar structure
        const result = parseDiyanetHtml(html, '9651', 'https://namazvakitleri.diyanet.gov.tr/tr-TR/9651/gebze-namaz-vakitleri');

        expect(result).toBeDefined();
        expect(result.districtId).toBe('9651');
        expect(result.times).toBeDefined();

        const { times } = result;
        expect(times.imsak).toMatch(/^\d{2}:\d{2}$/);
        expect(times.gunes).toMatch(/^\d{2}:\d{2}$/);
        expect(times.ogle).toMatch(/^\d{2}:\d{2}$/);
        expect(times.ikindi).toMatch(/^\d{2}:\d{2}$/);
        expect(times.aksam).toMatch(/^\d{2}:\d{2}$/);
        expect(times.yatsi).toMatch(/^\d{2}:\d{2}$/);

        console.log('Parsed Data:', result);
    });
});
