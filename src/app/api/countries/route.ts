import { NextResponse } from 'next/server';
import { fetchCountries } from '@/lib/diyanet';

export async function GET() {
    try {
        const countries = await fetchCountries();
        return NextResponse.json(countries);
    } catch (error) {
        console.error('Error fetching countries:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal Server Error' },
            { status: 500 }
        );
    }
}
