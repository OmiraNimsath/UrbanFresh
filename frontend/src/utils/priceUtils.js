/**
 * Utility – Formats a product price in LKR (Sri Lankan Rupees) with the
 * correct pricing unit suffix for display throughout the UI.
 *
 * Examples:
 *   formatPrice(450, 'PER_KG')   → "Rs. 450.00 / kg"
 *   formatPrice(120, 'PER_ITEM') → "Rs. 120.00"
 *   formatPrice(12.5, 'PER_L')   → "Rs. 12.50 / L"
 *
 * @param {number|string} price - numeric price value
 * @param {string}        unit  - PricingUnit enum string from the API
 * @returns {string} formatted price string
 */
const UNIT_LABELS = {
  PER_KG:   '/ kg',
  PER_G:    '/ g',
  PER_L:    '/ L',
  PER_ML:   '/ ml',
  PER_ITEM: '',
};

export function formatPrice(price, unit) {
  const amount = `Rs. ${Number(price).toLocaleString('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
  const suffix = UNIT_LABELS[unit] ?? '';
  return suffix ? `${amount} ${suffix}` : amount;
}

/**
 * Formats a plain currency amount with the standard Rs. prefix and exactly
 * two decimal places. Use this for order totals, line totals, and any
 * monetary value that does not carry a per-unit suffix.
 *
 * Example: formatAmount(1234.5) → "Rs. 1,234.50"
 *
 * @param {number|string} amount - monetary value
 * @returns {string} formatted string, e.g. "Rs. 1,234.50"
 */
export function formatAmount(amount) {
  return `Rs. ${Number(amount).toLocaleString('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Calculates the discounted price given original price and discount percentage.
 * Formula: discountedPrice = price * (1 - discount% / 100)
 *
 * Example: calculateDiscountedPrice(500, 15) → 425
 *
 * @param {number} price             - original product price
 * @param {number} discountPercentage - discount as integer 0-100
 * @returns {number} discounted price rounded to 2 decimals
 */
export function calculateDiscountedPrice(price, discountPercentage) {
  if (!discountPercentage || discountPercentage === 0) {
    return price;
  }
  const discounted = price * (1 - discountPercentage / 100);
  return Math.round(discounted * 100) / 100;
}

/**
 * Formats a discounted price display showing original → discounted (% OFF).
 * Returns just the formatted discounted amount if no discount applied.
 *
 * @param {number} price             - original product price
 * @param {number} discountPercentage - discount as integer 0-100
 * @param {string} unit              - PricingUnit enum string
 * @returns {string} formatted display of original and discounted prices
 */
export function formatDiscountedPrice(price, discountPercentage, unit) {
  if (!discountPercentage || discountPercentage === 0) {
    return formatPrice(price, unit);
  }
  
  const originalFormatted = formatPrice(price, unit);
  const discountedPrice = calculateDiscountedPrice(price, discountPercentage);
  const discountedFormatted = formatPrice(discountedPrice, unit);
  
  return `${originalFormatted} → ${discountedFormatted} (${discountPercentage}% OFF)`;
}
