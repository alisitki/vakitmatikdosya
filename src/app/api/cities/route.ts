import { NextRequest, NextResponse } from 'next/server';
import { fetchCities } from '@/lib/diyanet';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const countryId = searchParams.get('countryId');

    if (!countryId) {
        return NextResponse.json({ error: 'countryId is required' }, { status: 400 });
    }

    try {
        const cities = await fetchCities(countryId);
        return NextResponse.json(cities);
    } catch (error) {
        console.error('Error fetching cities:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal Server Error' },
            { status: 500 }
        );
    }
}
