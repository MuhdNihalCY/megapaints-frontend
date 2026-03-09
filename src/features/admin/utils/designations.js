// =====================================================
// Designation Constants - Frontend
// Single source: megapaints/src/features/kanban/utils/permissions.js
// =====================================================

import { getDesignationsList } from "../../kanban/utils/permissions";

/**
 * Predefined user designations (array for dropdowns/validation).
 * Derived from kanban permissions so the list stays in one place.
 */
export const DESIGNATIONS = getDesignationsList();

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
