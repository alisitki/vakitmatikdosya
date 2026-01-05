import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Gets the file path for a specific location's prayer times file
 */
function getFilePath(country: string, city: string, district?: string): string {
    const basePath = path.join(process.cwd(), 'public', 'download');

    if (district) {
        return path.join(basePath, country, city, `${district}.txt`);
    } else {
        return path.join(basePath, country, `${city}.txt`);
    }
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const country = searchParams.get('country');
    const city = searchParams.get('city');
    const district = searchParams.get('district');
    const name = searchParams.get('name');

    console.log(`[API Download] Request: country=${country}, city=${city}, district=${district}`);

    if (!country || !city) {
        return NextResponse.json(
            { error: 'country and city are required' },
            { status: 400 }
        );
    }

    try {
        const filePath = getFilePath(country, city, district || undefined);
        console.log(`[API Download] Looking for file: ${filePath}`);

        try {
            await fs.access(filePath);
        } catch {
            console.error(`[API Download] File not found: ${filePath}`);
            return NextResponse.json(
                { error: 'Dosya bulunamadı', path: filePath },
                { status: 404 }
            );
        }

        const fileContent = await fs.readFile(filePath);
        console.log(`[API Download] Read ${fileContent.length} bytes`);

        const fileName = name || district || city;

        return new NextResponse(fileContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}.txt`,
                'Cache-Control': 'public, max-age=86400',
            },
        });

    } catch (error) {
        console.error('[API Download] Error:', error);
        return NextResponse.json(
            { error: 'Dosya okuma hatası', details: String(error) },
            { status: 500 }
        );
    }
}
