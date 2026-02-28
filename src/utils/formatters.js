/**
 * Number & currency formatting utilities.
 */

export function formatNumber(num) {
    if (num == null || isNaN(num)) return '—';
    return Math.round(num).toLocaleString('en-US');
}

export function formatCurrency(num) {
    if (num == null || isNaN(num)) return '—';
    return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatPercent(num) {
    if (num == null || isNaN(num)) return '—';
    return num.toFixed(2) + '%';
}

export function formatCompact(num) {
    if (num == null || isNaN(num)) return '—';
    const abs = Math.abs(num);
    if (abs >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (abs >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (abs >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toFixed(0);
}

export function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
