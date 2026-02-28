import * as XLSX from 'xlsx';
import Papa from 'papaparse';

const COLUMN_MAP = {
    'daily event_date': 'date',
    'event_date': 'date',
    'date': 'date',
    'channel': 'channel',
    'page_type': 'page_type',
    'page_area': 'page_area',
    'strategy_family': 'strategy_family',
    'strategy': 'strategy',
    'strategy type': 'strategy_type',
    'total views': 'views',
    'views': 'views',
    'total clicks on recs': 'clicks',
    'clicks': 'clicks',
    'click through rate': 'ctr',
    'ctr': 'ctr',
    'total attributable sales': 'sales',
    'sales': 'sales',
    'total item from recs': 'items',
    'items': 'items',
    'total order from recs': 'orders',
    'orders': 'orders',
};

function normalizeColumnName(name) {
    if (!name) return name;
    return name.toString().trim().toLowerCase();
}

function normalizeRow(row, columnMapping) {
    const normalized = {};
    for (const [originalKey, value] of Object.entries(row)) {
        const normalizedKey = normalizeColumnName(originalKey);
        const mappedKey = columnMapping[normalizedKey] || normalizedKey;
        normalized[mappedKey] = value;
    }

    // Ensure numeric fields are numbers
    const numericFields = ['views', 'clicks', 'ctr', 'sales', 'items', 'orders'];
    for (const field of numericFields) {
        if (normalized[field] !== undefined) {
            normalized[field] = Number(normalized[field]) || 0;
        }
    }

    // Ensure date is a proper Date string
    if (normalized.date) {
        if (normalized.date instanceof Date) {
            normalized.date = normalized.date.toISOString().split('T')[0];
        } else if (typeof normalized.date === 'number') {
            // Excel serial date
            const excelDate = new Date((normalized.date - 25569) * 86400 * 1000);
            normalized.date = excelDate.toISOString().split('T')[0];
        } else {
            const parsed = new Date(normalized.date);
            if (!isNaN(parsed)) {
                normalized.date = parsed.toISOString().split('T')[0];
            }
        }
    }

    // Recalculate CTR if views and clicks are available
    if (normalized.views > 0 && normalized.clicks !== undefined) {
        normalized.ctr = (normalized.clicks / normalized.views) * 100;
    }

    return normalized;
}

function buildColumnMapping(headers) {
    const mapping = {};
    for (const header of headers) {
        const normalized = normalizeColumnName(header);
        if (COLUMN_MAP[normalized]) {
            mapping[normalized] = COLUMN_MAP[normalized];
        }
    }
    return mapping;
}

function parseExcel(arrayBuffer) {
    const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: 0 });

    if (jsonData.length === 0) {
        throw new Error('The file contains no data rows.');
    }

    const headers = Object.keys(jsonData[0]);
    const columnMapping = buildColumnMapping(headers);
    const data = jsonData.map(row => normalizeRow(row, columnMapping));

    return { data, originalHeaders: headers, columnMapping };
}

function parseCSV(text) {
    return new Promise((resolve, reject) => {
        Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true,
            complete: (results) => {
                if (results.errors.length > 0 && results.data.length === 0) {
                    reject(new Error('Failed to parse CSV: ' + results.errors[0].message));
                    return;
                }

                const headers = results.meta.fields;
                const columnMapping = buildColumnMapping(headers);
                const data = results.data.map(row => normalizeRow(row, columnMapping));
                resolve({ data, originalHeaders: headers, columnMapping });
            },
            error: (error) => reject(new Error('CSV parsing error: ' + error.message)),
        });
    });
}

export async function parseFile(file) {
    const extension = file.name.split('.').pop().toLowerCase();

    let result;
    if (extension === 'csv') {
        const text = await file.text();
        result = await parseCSV(text);
    } else if (['xlsx', 'xls'].includes(extension)) {
        const arrayBuffer = await file.arrayBuffer();
        result = parseExcel(arrayBuffer);
    } else {
        throw new Error(`Unsupported file type: .${extension}. Please upload a .csv, .xlsx, or .xls file.`);
    }

    // Compute metadata
    const dates = [...new Set(result.data.map(r => r.date).filter(Boolean))].sort();
    const meta = {
        fileName: file.name,
        fileSize: file.size,
        rowCount: result.data.length,
        dateRange: dates.length > 0 ? { start: dates[0], end: dates[dates.length - 1] } : null,
        uniqueDates: dates.length,
        columns: result.originalHeaders,
    };

    return { data: result.data, meta };
}
