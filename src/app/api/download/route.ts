import { NextRequest, NextResponse } from 'next/server';
import { getBrowser } from '@/lib/browser';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

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

    // Create temp directory for downloads
    const downloadPath = path.join(os.tmpdir(), `puppeteer-downloads-${Date.now()}`);
    fs.mkdirSync(downloadPath, { recursive: true });

    const browser = await getBrowser();
    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Setup CDP session for download handling
        const client = await page.createCDPSession();
        await client.send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: downloadPath,
        });

        // 1. Navigate to the location page
        const url = `https://namazvakitleri.diyanet.gov.tr/tr-TR/${id}`;
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // 2. Validate Location (if name provided)
        if (name) {
            try {
                await page.waitForFunction((expectedName: string) => {
                    const text = document.body.innerText.toLocaleLowerCase('tr-TR');
                    return text.includes(expectedName.toLocaleLowerCase('tr-TR'));
                }, { timeout: 5000 }, name);
            } catch (e) {
                console.warn(`[API] Name validation warning: Could not find "${name}" on page for ID ${id}`);
            }
        }

        // 3. Click "Yıllık Namaz Vakti"
        const clicked = await page.evaluate(() => {
            const elements = document.querySelectorAll('a, button');
            for (const el of elements) {
                if (el.textContent?.includes('Yıllık')) {
                    (el as HTMLElement).click();
                    return true;
                }
            }
            return false;
        });

        if (!clicked) {
            console.warn('[API] Could not find Yıllık tab, continuing anyway...');
        }

        // Wait for content to load
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 4. Click "Excel" and Handle Download
        await page.evaluate(() => {
            const elements = document.querySelectorAll('button, a');
            for (const el of elements) {
                if (el.textContent?.includes('Excel') || el.classList.contains('buttons-excel')) {
                    (el as HTMLElement).click();
                    return;
                }
            }
        });

        // Wait for download to complete
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Find downloaded file
        const files = fs.readdirSync(downloadPath);
        const excelFile = files.find(f => f.endsWith('.xlsx') || f.endsWith('.xls'));

        if (!excelFile) {
            throw new Error('Excel dosyası indirilemedi');
        }

        const buffer = fs.readFileSync(path.join(downloadPath, excelFile));

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

        // Cleanup temp directory
        try {
            fs.rmSync(downloadPath, { recursive: true, force: true });
        } catch (e) {
            console.warn('[API] Failed to cleanup temp directory:', e);
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
        // Cleanup on error
        try {
            fs.rmSync(downloadPath, { recursive: true, force: true });
        } catch (e) { }
        return NextResponse.json({ error: 'Download failed', details: String(error) }, { status: 500 });
    } finally {
        await browser.close();
    }
}
