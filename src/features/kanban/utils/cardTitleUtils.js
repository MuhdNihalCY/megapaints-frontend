/**
 * Card Title System Utilities
 * 
 * This module provides utilities for generating, formatting, and displaying
 * card titles using the Primary Identifier System and Customer Management.
 */

/**
 * Generate a kebab-case slug from a customer name
 * @param {string} name - Customer name
 * @returns {string} - Kebab-case slug
 */
export function generateCustomerSlug(name) {
  if (!name) return '';
  
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate complete card title from identifier and customer
 * @param {string} identifier - Primary identifier (e.g., "02-12-25-004")
 * @param {string|Object} customer - Customer object or customer name string
 * @returns {string} - Complete card title (e.g., "02-12-25-004-customername")
 */
export function generateCardTitle(identifier, customer) {
  if (!identifier) return '';
  
  // Normalize identifier format - ensure it's DD-MM-YY-XXX
  const identifierPattern = /^(\d{2})-(\d{2})-(\d{2})-(\d{3})$/;
  if (!identifierPattern.test(identifier)) {
    // If identifier doesn't match format, return as-is (shouldn't happen, but handle gracefully)
    console.warn('Identifier does not match expected format DD-MM-YY-XXX:', identifier);
  }
  
  if (!customer) {
    return identifier;
  }
  
  // Handle both string and object inputs
  const customerName = typeof customer === 'string' ? customer : customer.name;
  
  if (!customerName || !customerName.trim()) {
    return identifier;
  }
  
  const customerSlug = generateCustomerSlug(customerName);
  if (!customerSlug) {
    return identifier;
  }
  
  // Always return in format: DD-MM-YY-XXX-customername
  return `${identifier}-${customerSlug}`;
}

/**
 * Parse card title to extract identifier and customer slug
 * @param {string} cardTitle - Complete card title
 * @returns {Object} - { identifier, customerSlug }
 */
export function parseCardTitle(cardTitle) {
  if (!cardTitle) return { identifier: '', customerSlug: '' };
  
  // Split by last hyphen to separate identifier from customer slug
  const parts = cardTitle.split('-');
  
  if (parts.length < 4) {
    // Not enough parts for a valid identifier
    return { identifier: cardTitle, customerSlug: '' };
  }
  
  // Find where the identifier ends (DD-MM-YY-NNN format)
  // Look for the pattern: number-number-number-number
  let identifierEndIndex = -1;
  for (let i = 0; i < parts.length - 2; i++) {
    if (i >= 3 && /^\d{3}$/.test(parts[i])) {
      // Found the 3-digit counter
      identifierEndIndex = i;
      break;
    }
  }
  
  if (identifierEndIndex === -1) {
    // Couldn't find valid identifier pattern
    return { identifier: cardTitle, customerSlug: '' };
  }
  
  const identifier = parts.slice(0, identifierEndIndex + 1).join('-');
  const customerSlug = parts.slice(identifierEndIndex + 1).join('-');
  
  return { identifier, customerSlug };
}

/**
 * Format customer name for display
 * @param {Object} customer - Customer object
 * @returns {string} - Formatted display name
 */
export function formatCustomerDisplayName(customer) {
  if (!customer) return '';
  
  if (customer.company && customer.name !== customer.company) {
    return `${customer.name} (${customer.company})`;
  }
  
  return customer.name;
}

/**
 * Format card title for display
 * @param {string} cardTitle - Complete card title
 * @param {Object} customer - Customer object (optional, for better display)
 * @returns {string} - Formatted display title
 */
export function formatCardTitleForDisplay(cardTitle, customer = null) {
  if (!cardTitle) return '';
  
  const { identifier, customerSlug } = parseCardTitle(cardTitle);
  
  if (!customerSlug) {
    return identifier;
  }
  
  // If we have the customer object, use the formatted name
  if (customer) {
    return `${identifier} - ${formatCustomerDisplayName(customer)}`;
  }
  
  // Otherwise, convert slug back to readable format
  const customerName = customerSlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  return `${identifier} - ${customerName}`;
}

/**
 * Validate card title format
 * @param {string} cardTitle - Card title to validate
 * @returns {Object} - { isValid, errors }
 */
export function validateCardTitle(cardTitle) {
  const errors = [];
  
  if (!cardTitle) {
    errors.push('Card title is required');
    return { isValid: false, errors };
  }
  
  const { identifier, customerSlug } = parseCardTitle(cardTitle);
  
  // Validate identifier format (DD-MM-YY-NNN)
  const identifierPattern = /^\d{2}-\d{2}-\d{2}-\d{3}$/;
  if (!identifierPattern.test(identifier)) {
    errors.push('Invalid identifier format. Expected DD-MM-YY-NNN');
  }
  
  // Validate customer slug
  if (customerSlug && !/^[a-z0-9-]+$/.test(customerSlug)) {
    errors.push('Invalid customer slug format');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Extract identifier from card title
 * @param {string} cardTitle - Complete card title
 * @returns {string} - Primary identifier
 */
export function extractIdentifier(cardTitle) {
  const { identifier } = parseCardTitle(cardTitle);
  return identifier;
}

/**
 * Extract customer slug from card title
 * @param {string} cardTitle - Complete card title
 * @returns {string} - Customer slug
 */
export function extractCustomerSlug(cardTitle) {
  const { customerSlug } = parseCardTitle(cardTitle);
  return customerSlug;
}

/**
 * Check if two customers have the same name (case-insensitive)
 * @param {Object} customer1 - First customer
 * @param {Object} customer2 - Second customer
 * @returns {boolean} - True if names match
 */
export function isDuplicateCustomerName(customer1, customer2) {
  if (!customer1 || !customer2) return false;
  
  const name1 = customer1.name?.toLowerCase().trim();
  const name2 = customer2.name?.toLowerCase().trim();
  
  return name1 === name2;
}

/**
 * Generate a unique customer name suggestion
 * @param {string} baseName - Base customer name
 * @param {Array} existingCustomers - Array of existing customers
 * @returns {string} - Suggested unique name
 */
export function generateUniqueCustomerName(baseName, existingCustomers = []) {
  if (!baseName) return '';
  
  const baseNameLower = baseName.toLowerCase().trim();
  const existingNames = existingCustomers.map(c => c.name?.toLowerCase().trim()).filter(Boolean);
  
  if (!existingNames.includes(baseNameLower)) {
    return baseName;
  }
  
  // Try adding numbers
  let counter = 1;
  while (counter <= 100) {
    const suggestedName = `${baseName} ${counter}`;
    const suggestedNameLower = suggestedName.toLowerCase().trim();
    
    if (!existingNames.includes(suggestedNameLower)) {
      return suggestedName;
    }
    
    counter++;
  }
  
  // Fallback with timestamp
  const timestamp = Date.now().toString().slice(-4);
  return `${baseName} ${timestamp}`;
}

/**
 * Format identifier for display with better readability
 * @param {string} identifier - Primary identifier
 * @returns {string} - Formatted identifier
 */
export function formatIdentifierForDisplay(identifier) {
  if (!identifier) return '';
  
  // Add spaces for better readability: DD-MM-YY-NNN -> DD-MM-YY NNN
  return identifier.replace(/(\d{2}-\d{2}-\d{2})-(\d{3})/, '$1 $2');
}

/**
 * Get card title components for editing
 * @param {string} cardTitle - Complete card title
 * @returns {Object} - { identifier, customerName, customerSlug }
 */
export function getCardTitleComponents(cardTitle) {
  const { identifier, customerSlug } = parseCardTitle(cardTitle);
  
  const customerName = customerSlug
    ? customerSlug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    : '';
  
  return {
    identifier,
    customerName,
    customerSlug
  };
}

/**
 * Create card title from components
 * @param {string} identifier - Primary identifier (format: DD-MM-YY-XXX)
 * @param {string} customerName - Customer name
 * @returns {string} - Complete card title (format: DD-MM-YY-XXX-customername)
 */
export function createCardTitleFromComponents(identifier, customerName) {
  if (!identifier) return '';
  
  // Normalize identifier format - ensure it's DD-MM-YY-XXX
  const identifierPattern = /^(\d{2})-(\d{2})-(\d{2})-(\d{3})$/;
  if (!identifierPattern.test(identifier)) {
    console.warn('Identifier does not match expected format DD-MM-YY-XXX:', identifier);
  }
  
  if (!customerName || !customerName.trim()) {
    return identifier;
  }
  
  const customerSlug = generateCustomerSlug(customerName);
  if (!customerSlug) {
    return identifier;
  }
  
  // Always return in format: DD-MM-YY-XXX-customername
  return `${identifier}-${customerSlug}`;
}

export default {
  generateCustomerSlug,
  generateCardTitle,
  parseCardTitle,
  formatCustomerDisplayName,
  formatCardTitleForDisplay,
  validateCardTitle,
  extractIdentifier,
  extractCustomerSlug,
  isDuplicateCustomerName,
  generateUniqueCustomerName,
  formatIdentifierForDisplay,
  getCardTitleComponents,
  createCardTitleFromComponents
};
