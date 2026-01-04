import { NextRequest, NextResponse } from 'next/server';
import { fetchPrayerTimes, DiyanetError } from '@/lib/diyanet';
import { z } from 'zod';

const querySchema = z.object({
    districtId: z.string().min(1).default('9651'),
    urlMode: z.string().optional(),
});

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const districtId = searchParams.get('districtId') || '9651';

    // Basic validation using Zod (though purely string here)
    const result = querySchema.safeParse({ districtId });

    if (!result.success) {
        return NextResponse.json({ error: 'Invalid district ID' }, { status: 400 });
    }

    try {
        const data = await fetchPrayerTimes(result.data.districtId);
        return NextResponse.json(data);
    } catch (error) {
        console.error('API Error:', error);

        if (error instanceof DiyanetError) {
            return NextResponse.json({ error: error.message }, { status: 502 });
        }

        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
