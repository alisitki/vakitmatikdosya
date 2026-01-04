import { NextRequest, NextResponse } from 'next/server';
import { chromium } from 'playwright';

// Helper to slugify name for validation (approximate)
function slugify(text: string) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-\u00C0-\u017F]+/g, '') // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}

const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const name = searchParams.get('name');

    if (!id) {
        return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    console.log(`[API] Starting download for ID: ${id}, Name: ${name}`);

    const browser = await chromium.launch({ headless: true });
    try {
        const page = await browser.newPage({
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });

        // 1. Navigate to the location page
        const url = `https://namazvakitleri.diyanet.gov.tr/tr-TR/${id}`;
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // 2. Validate Location (if name provided)
        if (name) {
            try {
                await page.waitForFunction((expectedName) => {
                    const text = document.body.innerText.toLocaleLowerCase('tr-TR');
                    return text.includes(expectedName.toLocaleLowerCase('tr-TR'));
                }, name, { timeout: 5000 });
            } catch (e) {
                console.warn(`[API] Name validation warning: Could not find "${name}" on page for ID ${id}`);
            }
        }

        // 3. Click "Yıllık Namaz Vakti"
        const yearlyTabSelector = 'a:has-text("Yıllık Namaz Vakti"), button:has-text("Yıllık Namaz Vakti")';
        const genericYearlySelector = 'text=Yıllık';

        try {
            await page.waitForSelector(yearlyTabSelector, { timeout: 5000 });
            await page.click(yearlyTabSelector);
        } catch (e) {
            console.log('[API] Specific Yıllık selector failed, trying generic...');
            try {
                await page.waitForSelector(genericYearlySelector, { timeout: 5000 });
                await page.click(genericYearlySelector);
            } catch (innerE) {
                console.error('[API] Failed to click Yıllık tab:', innerE);
                throw new Error('Yıllık sekmesi bulunamadı');
            }
        }

        // 4. Click "Excel" and Handle Download
        const excelSelector = 'button:has-text("Excel"), a:has-text("Excel"), .buttons-excel';
        await page.waitForSelector(excelSelector, { timeout: 10000 });

        const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
        await page.click(excelSelector);

        const download = await downloadPromise;
        const stream = await download.createReadStream();
        const chunks: any[] = [];
        for await (const chunk of stream) {
            chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);

        // Parse Excel using exceljs
        const ExcelJSModule = await import('exceljs');
        const ExcelJS = ExcelJSModule.default || ExcelJSModule;
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer as any);

        const worksheet = workbook.getWorksheet(1);
        let txtOutputString = '';
        const safeName = (name || 'SOH').toUpperCase();

        const fullHeaderTemplate =
            `                               T.C.              \n` +
            `                         CUMHURBA\uFFFDKANLI\uFFFDI                  \n` +
            `                     D\uFFFDYANET \uFFFD\uFFFDLER\uFFFD BA\uFFFDKANLI\uFFFDI             \n` +
            `              PUSULA KIBLE SEMTi (KUZEYDEN)  147 Derece\n` +
            `                              ${safeName}_N           \n`;

        const miniHeaderTemplate = `                              ${safeName}_N           \n`;
        let currentMonth = '';

        worksheet?.eachRow((row) => {
            const dateCell = row.getCell(1).value;
            if (!dateCell) return;

            let dateStr = '';
            if (dateCell instanceof Date) {
                const d = dateCell.getDate().toString().padStart(2, '0');
                const m = (dateCell.getMonth() + 1).toString().padStart(2, '0');
                const y = dateCell.getFullYear();
                dateStr = `${d}.${m}.${y}`;
            } else {
                dateStr = String(dateCell).trim();
            }

            let day, monthNameRaw, year;
            const textDateMatch = dateStr.match(/^(\d{2})\s+([a-zA-ZİıŞşÇçĞğÜüÖö]+)\s+(\d{4})/);

            if (textDateMatch) {
                day = textDateMatch[1];
                monthNameRaw = textDateMatch[2];
                year = textDateMatch[3];
            } else if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateStr)) {
                const parts = dateStr.split('.');
                day = parts[0];
                const mIndex = parseInt(parts[1]) - 1;
                const trMonths = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
                monthNameRaw = trMonths[mIndex];
                year = parts[2];
            } else {
                return;
            }

            const monthMapping: Record<string, string> = {
                "Ocak": "OCAK", "Şubat": "SUBAT", "Mart": "MART", "Nisan": "NISAN", "Mayıs": "MAYIS", "Haziran": "HAZIRAN",
                "Temmuz": "TEMMUZ", "Ağustos": "AGUSTOS", "Eylül": "EYLUL", "Ekim": "EKIM", "Kasım": "KASIM", "Aralık": "ARALIK"
            };
            const monthName = monthMapping[monthNameRaw] || monthNameRaw.toUpperCase();

            if (monthName !== currentMonth) {
                if (currentMonth !== '') {
                    if (txtOutputString.endsWith('\n')) txtOutputString = txtOutputString.slice(0, -1);
                    txtOutputString += `\x12\n\n`;
                }
                currentMonth = monthName;
                txtOutputString += (txtOutputString === '' ? fullHeaderTemplate : miniHeaderTemplate);
                txtOutputString += `                             ${year} - ${monthName}\n`;
                txtOutputString += `           GUN  MSAK  GUNES  LE   KND AKAM  YATSI  K.SAT\n`;
                txtOutputString += `           ---  -----  -----  ----   ------ -----  -----  -----\n`;
            }

            const formatCell = (idx: number) => String(row.getCell(idx).value || '').trim().replace(':', ' ');
            const imsak = formatCell(3);
            const gunes = formatCell(4);
            const ogle = formatCell(5);
            const ikindi = formatCell(6);
            const aksam = formatCell(7);
            const yatsi = formatCell(8);
            const ksat = "00 00";

            txtOutputString += `           ${day}   ${imsak}  ${gunes}  ${ogle}  ${ikindi}  ${aksam}  ${yatsi}  ${ksat}\n`;
        });

        if (txtOutputString.length > 0) {
            if (txtOutputString.endsWith('\n')) txtOutputString = txtOutputString.slice(0, -1);
            txtOutputString += `\x12\n\n`;
        }

        return new NextResponse(Buffer.from(txtOutputString, 'utf-8'), {
            status: 200,
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(safeName)}.txt`,
            },
        });

    } catch (error) {
        console.error('[API] Download error:', error);
        return NextResponse.json({ error: 'Download failed', details: String(error) }, { status: 500 });
    } finally {
        await browser.close();
    }
}
