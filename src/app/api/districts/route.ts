import { NextRequest, NextResponse } from 'next/server';
import { fetchDistricts } from '@/lib/diyanet';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const countryId = searchParams.get('countryId');
    const cityId = searchParams.get('cityId');

    if (!countryId || !cityId) {
        return NextResponse.json({ error: 'countryId and cityId are required' }, { status: 400 });
    }

    try {
        const districts = await fetchDistricts(countryId, cityId);
        return NextResponse.json(districts);
    } catch (error) {
        console.error('Error fetching districts:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal Server Error' },
            { status: 500 }
        );
    }
}
