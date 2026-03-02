import api from '../../utils/api';
import { FormulaService } from './formulaService';

/**
 * File Number Generation Service
 * 
 * This service handles the generation and management of file numbers for paint formulas.
 * It implements the same logic as the server-side generateFileNo function.
 */

/**
 * Increments an alphabetic suffix (A -> B -> C -> ... -> Z -> AA -> AB -> ...)
 * @param {string} suffix - Current alphabetic suffix
 * @returns {string} Next alphabetic suffix
 */
function incrementAlphabetic(suffix) {
  let carry = 1;
  let result = '';
  
  for (let i = suffix.length - 1; i >= 0; i--) {
    let char = suffix.charCodeAt(i);
    if (carry === 1) {
      if (char === 90) { // 'Z'
        result = 'A' + result;
        carry = 1;
      } else {
        result = String.fromCharCode(char + 1) + result;
        carry = 0;
      }
    } else {
      result = String.fromCharCode(char) + result;
    }
  }
  
  if (carry === 1) {
    result = 'A' + result;
  }
  
  return result;
}

/**
 * Increments a file number suffix (100000 -> 100000.A -> 100000.B -> 100000.AA)
 * @param {string} fileNo - Current file number
 * @returns {string} File number with incremented suffix
 */
function incrementSuffix(fileNo) {
  // Extract the base number part and the suffix part
  let parts = fileNo.match(/(\d+)(\.[A-Z]+)?/);
  if (!parts) return fileNo;
  
  let base = parts[1];
  let suffix = parts[2] ? parts[2].slice(1) : '';

  // If there is no suffix, start with 'A'
  if (suffix === '') {
    return `${base}.A`;
  }

  // Increment the suffix
  let nextSuffix = incrementAlphabetic(suffix);
  return `${base}.${nextSuffix}`;
}

function pad2(value) {
  const x = String(value ?? '').trim();
  if (!x) return '';
  const n = parseInt(x, 10);
  if (!Number.isFinite(n)) return x;
  return n < 10 ? `0${n}` : String(n);
}

function getLabelFromStoredFileNo(stored) {
  // Extract numeric base + optional .A/.AA suffix from the beginning
  const m = String(stored ?? '').match(/^(\d+(?:\.[A-Z]+)?)/);
  return m ? m[1] : '';
}

/**
 * Formats a file number with subcategory suffix, gloss, and additive information
 * @param {string} fileNo - Base file number
 * @param {string} subcategoryID - Subcategory name or ID (used for suffix lookup)
 * @param {string|number} gloss - Gloss level
 * @param {string} additiveID - Additive ID
 * @param {string|number} additivePercentage - Additive percentage
 * @param {Array} subcategories - Array of subcategory objects
 * @param {Array} additives - Array of additive objects
 * @returns {string} Formatted file number
 */
function formulaFileFormat(fileNo, subcategoryID, gloss, additiveID, additivePercentage, subcategories, additives) {
  let result = String(fileNo || '');

  // Add subcategory suffix if available
  let subSuffix = '';
  if (subcategoryID && subcategories) {
    const key = String(subcategoryID);
    const subcategory = subcategories.find((sub) => {
      if (!sub) return false;
      const id = sub.id || sub._id || sub.SubCategory_Id || sub.Subcategory_Id || '';
      const name = sub.name || sub.SubCategory || sub.Subcategory_Name || sub.label || '';
      return String(id) === key || String(name) === key;
    });
    if (subcategory) {
      subSuffix = String(subcategory.suffix || subcategory.Suffix || '').trim();
    }
  }
  if (subSuffix) {
    result = `${result}-${subSuffix}`;
  }

  // Add gloss/matt if available (2 digits), dash-separated
  const glossStr = pad2(gloss);
  if (glossStr && parseInt(glossStr, 10) > 0) {
    result = `${result}-${glossStr}`;
  }

  // Add additive information if both additive and percentage are available
  const pctStr = pad2(additivePercentage);
  if (additiveID && pctStr && parseInt(pctStr, 10) > 0 && additives) {
    const addKey = String(additiveID);
    const additive = additives.find((add) =>
      String(add?._id || '') === addKey ||
      String(add?.Additive_Id || '') === addKey ||
      String(add?.id || '') === addKey
    );
    const addSuffix = String(additive?.Suffix || additive?.suffix || '').trim();
    if (addSuffix) {
      // Same as old: suffix + pct are glued together, but the segment itself is dash-separated
      result = `${result}-${addSuffix}${pctStr}`;
    }
  }

  return result;
}

/**
 * Generates a new file number for a formula
 * @param {Object} data - Formula data
 * @param {boolean} isNewFormula - Whether this is a new formula
 * @returns {Promise<Object>} Object containing labelFileNo and fileNo
 */
async function generateFileNo(data, isNewFormula = true) {
  try {
    // Fetch existing formulas to check for duplicates
    const res = await FormulaService.fetchAllFormulas();
    const formulasList = res?.data ?? res?.formulas ?? [];
    // We don't store labelFileNo in DB; derive it from stored file numbers (leading digits + optional .A/.AA).
    const existingLabelFileNos = new Set(
      formulasList
        .map((doc) => getLabelFromStoredFileNo(doc?.labelFileNo ?? doc?.file_no ?? doc?.FileNo))
        .filter(Boolean)
    );

    let labelFileNo;
    let formattedFileNo;

    if (data.fileNumberUpdated && data.newFileNumber) {
      // Manual file number update - check for duplicates and increment if needed
      let candidateFileNo = data.newFileNumber;

      while (
        existingLabelFileNos.has(candidateFileNo) ||
        existingLabelFileNos.has(String(candidateFileNo))
      ) {
        console.log("File number already exists, incrementing...");
        candidateFileNo = incrementSuffix(candidateFileNo);
      }

      labelFileNo = candidateFileNo;
    } else {
      // Automatic file number generation
      let fileNo = 100000; // Default starting number

      if (formulasList.length > 0) {
        const latestFormula = formulasList[0];
        const latestFileNo = latestFormula.FileNo || latestFormula.file_no || latestFormula.labelFileNo;
        
        if (latestFileNo) {
          // Extract the numeric part using regex
          const numericMatch = String(latestFileNo).match(/^\d+/);
          if (numericMatch) {
            fileNo = parseInt(numericMatch[0]) + 1;
          }
        }
      }

      labelFileNo = fileNo;
    }

    // Format the file number with subcategory, gloss, and additive information
    formattedFileNo = formulaFileFormat(
      labelFileNo,
      data.SubCategory,
      data.gloss || data.matt,
      data.additiveId,
      data.AdditivePercentage,
      data.subcategories || [],
      data.additives || []
    );

    return {
      labelFileNo: labelFileNo,
      fileNo: formattedFileNo
    };
  } catch (error) {
    console.error('Error generating file number:', error);
    // Fallback to a simple timestamp-based number
    const fallbackNumber = Math.floor(Date.now() / 1000) % 1000000;
    return {
      labelFileNo: fallbackNumber,
      fileNo: String(fallbackNumber)
    };
  }
}

/**
 * Validates if a file number is unique
 * @param {string} fileNo - File number to validate
 * @returns {Promise<boolean>} True if unique, false if duplicate
 */
async function validateFileNumber(fileNo) {
  try {
    const res = await FormulaService.fetchAllFormulas();
    const formulasList = res?.data ?? res?.formulas ?? [];
    const existingLabelFileNos = new Set(
      formulasList
        .map((doc) => getLabelFromStoredFileNo(doc?.labelFileNo ?? doc?.file_no ?? doc?.FileNo))
        .filter(Boolean)
    );
    const candidate = String(fileNo || '').trim();
    return candidate ? !existingLabelFileNos.has(candidate) : true;
  } catch (error) {
    console.error('Error validating file number:', error);
    return true; // Assume unique if validation fails
  }
}

export const FileNumberService = {
  generateFileNo,
  validateFileNumber,
  incrementSuffix,
  formulaFileFormat
};

export default FileNumberService;
