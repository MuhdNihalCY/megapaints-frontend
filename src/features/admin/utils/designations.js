// =====================================================
// Designation Constants - Frontend
// MegaPaints Frontend - User Designation Constants
// =====================================================

/**
 * Predefined user designations
 * Must match backend constants in backend/utils/constants.js
 */
export const DESIGNATIONS = [
  'Sales',
  'Office',
  'Production',
  'Driver',
  'Manager',
  'Supervisor'
];

/**
 * Get all available designations
 * @returns {Array<string>} Array of designation strings
 */
export const getDesignations = () => {
  return [...DESIGNATIONS];
};

/**
 * Check if a designation is valid
 * @param {string} designation - Designation to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const isValidDesignation = (designation) => {
  return DESIGNATIONS.includes(designation);
};

export default DESIGNATIONS;
