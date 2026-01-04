import { NextRequest, NextResponse } from 'next/server';
import { fetchPrayerTimes, DiyanetError } from '@/lib/diyanet';
import { renderTemplate } from '@/lib/template';
import { z } from 'zod';

const exportSchema = z.object({
    districtId: z.string().min(1).default('9651'),
    template: z.string().max(10000).default('{{date}}\nİmsak: {{imsak}}\nGüneş: {{gunes}}\nÖğle: {{ogle}}\nİkindi: {{ikindi}}\nAkşam: {{aksam}}\nYatsı: {{yatsi}}'),
    filename: z.string().max(255).optional(),
});

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const rawParams = {
        districtId: searchParams.get('districtId') || '9651',
        template: searchParams.get('template') || undefined,
        filename: searchParams.get('filename') || undefined,
    };

    const result = exportSchema.safeParse(rawParams);

    if (!result.success) {
        return new Response('Invalid parameters', { status: 400 });
    }

    const { districtId, template, filename } = result.data;

    try {
        const data = await fetchPrayerTimes(districtId);
        const output = renderTemplate(template, data);

        // Determine filename
        // Standardize date to YYYYMMDD? The Diyanet date format is "04 Ocak 2026 Pazar" or similar.
        // We'll just generate a basic timestamp if parsing fails or use a default.
        // User requested "namaz-<districtId>-<YYYYMMDD>.txt" as default.

        let finalFilename = filename;
        if (!finalFilename) {
            const now = new Date();
            const yyyy = now.getFullYear();
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const dd = String(now.getDate()).padStart(2, '0');
            finalFilename = `namaz-${districtId}-${yyyy}${mm}${dd}.txt`;
        }

        // Encode filename for header
        const encodedFilename = encodeURIComponent(finalFilename);

        return new Response(output, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Content-Disposition': `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`,
            },
        });

    } catch (error) {
        console.error('Export Error:', error);
        if (error instanceof DiyanetError) {
            return new Response(`Error: ${error.message}`, { status: 502 });
        }
        return new Response('Internal Server Error', { status: 500 });
    }
}
