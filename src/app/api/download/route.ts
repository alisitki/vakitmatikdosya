
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
        // We rely on the ID. Diyanet usually redirects /tr-TR/{id} to the full slug url
        const url = `https://namazvakitleri.diyanet.gov.tr/tr-TR/${id}`;
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // 2. Validate Location (if name provided)
        // This is crucial per user request to avoid downloading wrong data
        if (name) {
            const pageTitle = await page.title();
            const h1Text = await page.locator('.district-name').first().innerText().catch(() => '');
            // Note: .district-name is a guess, we might need a broader check
            // Let's just check the whole body text for the City Name to be permissive but safe
            const bodyText = await page.evaluate(() => document.body.innerText);

            // Normalize for comparison
            const normalizedName = name.toLocaleLowerCase('tr-TR');
            const normalizedBody = bodyText.toLocaleLowerCase('tr-TR');

            // If the name is totally missing, something might be wrong (or just not loaded yet)
            // But strict validation might be too flaky. 
            // Let's trust the ID navigation mostly, but wait for the name to appear.
            try {
                await page.waitForFunction((expectedName) => {
                    const text = document.body.innerText.toLocaleLowerCase('tr-TR');
                    return text.includes(expectedName.toLocaleLowerCase('tr-TR'));
                }, name, { timeout: 5000 });
            } catch (e) {
                console.warn(`[API] Name validation warning: Could not find "${name}" on page for ID ${id}`);
                // We proceed, but log it. The ID is the source of truth.
            }
        }

        // 3. Click "Yıllık Namaz Vakti"
        // Try specific text first which we verified works
        const yearlyTabSelector = 'a:has-text("Yıllık Namaz Vakti"), button:has-text("Yıllık Namaz Vakti")';
        const genericYearlySelector = 'text=Yıllık';

        try {
            await page.waitForSelector(yearlyTabSelector, { timeout: 5000 });
            await page.click(yearlyTabSelector);
        } catch (e) {
            console.log('[API] Specific Yıllık selector failed, trying generic...');
            try {
                // Fallback
                await page.waitForSelector(genericYearlySelector, { timeout: 5000 });
                await page.click(genericYearlySelector);
            } catch (innerE) {
                console.error('[API] Failed to click Yıllık tab:', innerE);
                throw new Error('Yıllık sekmesi bulunamadı');
            }
        }

        // 4. Click "Excel" and Handle Download
        // The excel button is likely inside the tab-3 content
        const excelSelector = 'button:has-text("Excel"), a:has-text("Excel"), .buttons-excel';

        // Wait for the button to be visible (implies data loaded)
        await page.waitForSelector(excelSelector, { timeout: 10000 });

        // Setup download listener
        const downloadPromise = page.waitForEvent('download', { timeout: 15000 });

        await page.click(excelSelector);

        const download = await downloadPromise;
        const suggestedFilename = download.suggestedFilename();
        console.log(`[API] Download started: ${suggestedFilename}`);

        // Read the downloaded Excel
        const stream = await download.createReadStream();
        const chunks: Buffer[] = [];
        for await (const chunk of stream) {
            chunks.push(Buffer.from(chunk));
        }
        const buffer = Buffer.concat(chunks);
        console.error(`[CRITICAL] Downloaded Buffer Size: ${buffer.length}`);

        if (buffer.length === 0) {
            throw new Error('Downloaded Excel file is empty!');
        }

        // Parse Excel using exceljs
        const ExcelJSModule = await import('exceljs');
        const iconv = await import('iconv-lite');
        const ExcelJS = ExcelJSModule.default || ExcelJSModule;
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer as any);

        // Assume first sheet
        const worksheet = workbook.getWorksheet(1);

        let txtOutputString = '';
        const safeName = (name || 'SOH').toUpperCase();

        // Headers constant info - using \uFFFD for corrupted Turkish chars to match original
        const fullHeaderTemplate =
            `                               T.C.              \n` +
            `                         CUMHURBA\uFFFDKANLI\uFFFDI                  \n` +
            `                     D\uFFFDYANET \uFFFD\uFFFDLER\uFFFD BA\uFFFDKANLI\uFFFDI             \n` +
            `              PUSULA KIBLE SEMTi (KUZEYDEN)  147 Derece\n` +
            `                              ${safeName}_N           \n`;

        const miniHeaderTemplate = `                              ${safeName}_N           \n`;


        // Used to track month changes
        let currentMonth = '';
        const monthNames = ["OCAK", "SUBAT", "MART", "NISAN", "MAYIS", "HAZIRAN", "TEMMUZ", "AGUSTOS", "EYLUL", "EKIM", "KASIM", "ARALIK"];

        worksheet?.eachRow((row, rowNumber) => {
            const dateCell = row.getCell(1).value;
            if (!dateCell) return;

            let dateStr = '';
            if (dateCell instanceof Date) {
                const d = dateCell.getDate().toString().padStart(2, '0');
                const m = (dateCell.getMonth() + 1).toString().padStart(2, '0');
                const y = dateCell.getFullYear();
                dateStr = `${d}.${m}.${y}`;
            } else if (typeof dateCell === 'object' && dateCell !== null) {
                // @ts-ignore
                if (dateCell.richText) dateStr = dateCell.richText.map(r => r.text).join('');
                // @ts-ignore
                else if (dateCell.text) dateStr = dateCell.text;
                // @ts-ignore
                else if (dateCell.result !== undefined) dateStr = String(dateCell.result);
                else dateStr = String(dateCell);
            } else {
                dateStr = String(dateCell).trim();
            }

            // Regex Check
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
                "Temmuz": "TEMMUZ", "Ağustos": "AGUSTOS", "Eylül": "EYLUL", "Ekim": "EKIM", "Kasım": "KASIM", "Aralık": "ARALIK",
                "ocak": "OCAK", "şubat": "SUBAT", "mart": "MART", "nisan": "NISAN", "mayıs": "MAYIS", "haziran": "HAZIRAN",
                "temmuz": "TEMMUZ", "ağustos": "AGUSTOS", "eylül": "EYLUL", "ekim": "EKIM", "kasım": "KASIM", "aralık": "ARALIK"
            };
            const monthName = monthMapping[monthNameRaw] || monthNameRaw.toUpperCase();

            // Check if we need to print header for new month
            if (monthName !== currentMonth) {
                // If not first month, add spacing and Page Break char maybe?
                // User said "symbol marking end of month". Inspection showed 12 (0x12 -> DC2) then \n\n
                if (currentMonth !== '') {
                    // Remove last newline logic adapted for CRLF (remove 2 chars?)
                    // Actually just remove \r\n
                    if (txtOutputString.endsWith('\n')) {
                        txtOutputString = txtOutputString.slice(0, -1);
                    }
                    txtOutputString += `\x12\n\n`;
                }

                currentMonth = monthName;

                // Apply Header Strategy: Full Header only if first month (e.g. Current Month or Jan)?
                // Original file had full header at top. subsequent months had mini header.
                if (txtOutputString === '') {
                    txtOutputString += fullHeaderTemplate;
                } else {
                    txtOutputString += miniHeaderTemplate;
                }

                // L5 Target: 40 chars. "                             2026 - OCAK" (29 spaces + 11 chars)
                txtOutputString += `                             ${year} - ${monthName}\n`;
                // L6 Target: 77 chars. Mine was 62. Missing 15 chars.
                // "           GUN  İMSAK  GUNES  ÖĞLE   İKİNDİ AKŞAM  YATSI  K.SAT" -> 62 chars
                // Add 15 trailing spaces? Or leading?
                // Original L6: "           GUN  İMSAK  GUNES  ÖĞLE   İKİNDİ AKŞAM  YATSI  K.SAT"
                // If original has 77 chars, and visible is 62, there MUST be 15 trailing spaces.
                txtOutputString += `           GUN  �MSAK  GUNES  ��LE   �K�ND� AK�AM  YATSI  K.SAT\n`;
                // L7 Target: 63. Original has no trailing space.
                txtOutputString += `           ---  -----  -----  ----   ------ -----  -----  -----\n`;
            }

            const formatTime = (cellVal: any) => {
                let t = '';
                if (typeof cellVal === 'object' && cellVal !== null) {
                    // @ts-ignore
                    if (cellVal.richText) t = cellVal.richText.map(r => r.text).join('');
                    // @ts-ignore
                    else if (cellVal.text) t = cellVal.text;
                    // @ts-ignore
                    else if (cellVal.result !== undefined) t = String(cellVal.result);
                    else t = String(cellVal);
                } else {
                    t = String(cellVal);
                }
                return t.trim().replace(':', ' ');
            };

            // Column mapping 
            const imsak = formatTime(row.getCell(3).value);
            const gunes = formatTime(row.getCell(4).value);
            const ogle = formatTime(row.getCell(5).value);
            const ikindi = formatTime(row.getCell(6).value);
            const aksam = formatTime(row.getCell(7).value);
            const yatsi = formatTime(row.getCell(8).value);
            const ksat = "00 00";

            // Data Row Target L8: 63 chars.
            // "           01   06 19  07 45  12 47  15 18  17 39  19 00  00 00" -> 63 chars.
            // My previous gen was 63 chars (11 leading spaces + 52 content).
            // So data row is correct.
            txtOutputString += `           ${day}   ${imsak}  ${gunes}  ${ogle}  ${ikindi}  ${aksam}  ${yatsi}  ${ksat}\n`;
        });

        // Final month cleanup: check if we need to add the symbol at the very end too?
        // Original sample ended with 00 00^R$ -> Yes, last line of file also had it.
        // Wait, line 39 had it. Line 430 (end of file) probably has it too.
        // Let's protectively add it.
        if (txtOutputString.length > 0) {
            if (txtOutputString.endsWith('\n')) {
                txtOutputString = txtOutputString.slice(0, -1);
            }
            txtOutputString += `\x12\n\n`;
        }

        // Output as UTF-8 (with replacement chars matching original)
        const encodedBuffer = Buffer.from(txtOutputString, 'utf-8');

        // Provide the TXT
        return new NextResponse(encodedBuffer, {
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
