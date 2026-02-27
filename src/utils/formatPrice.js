/**
 * Format a price for display with up to 10 decimal places.
 * Trailing zeros after the decimal point are trimmed.
 * @param {number|string} value - Price value
 * @param {number} maxDecimals - Maximum decimal places (default 10)
 * @returns {string} Formatted price string
 */
export function formatPrice(value, maxDecimals = 10) {
    const num = Number(value);
    if (Number.isNaN(num)) return '0.00';
    const s = num.toFixed(maxDecimals);
    return s.replace(/\.?0+$/, '') || '0';
}
