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

/**
 * Formats a file number with subcategory suffix, gloss, and additive information
 * @param {string} fileNo - Base file number
 * @param {string} subcategoryID - Subcategory ID for suffix lookup
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
  if (subcategoryID && subcategories) {
    const subcategory = subcategories.find(sub => {
      const subId = sub.id || sub._id || sub.SubCategory_Id || sub.Subcategory_Id || sub.SubCategoryId || '';
      return String(subId) === String(subcategoryID);
    });
    
    // Check for suffix in various possible locations
    if (subcategory) {
      const suffix = subcategory.Suffix || subcategory.suffix || subcategory.Suffix || '';
      if (suffix) {
        result = `${result}-${suffix}`;
      }
    }
  }

  // Add gloss if available (ensure it's a string with two digits)
  if (gloss !== undefined && gloss !== null && gloss !== '') {
    let glossStr = String(gloss);
    if (parseInt(glossStr) && parseInt(glossStr) < 10) {
      glossStr = '0' + glossStr; // Ensure two digits for gloss
    }
    result = `${result}${String(result).includes('-') ? '' : '-'}${glossStr}`;
  }

  // Add additive information if both additive and percentage are available
  if (additiveID && additivePercentage && additives) {
    const additive = additives.find(add => 
      add._id === additiveID || 
      add.Additive_Id === additiveID
    );
    
    if (additive && additive.Suffix) {
      let percentageStr = String(additivePercentage);
      if (parseInt(percentageStr) && parseInt(percentageStr) < 10) {
        percentageStr = '0' + percentageStr; // Ensure two digits for additivePercentage
      }
      result = `${result}-${additive.Suffix}${percentageStr}`;
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
    const existingFormulas = await FormulaService.fetchAllFormulas();
    
    const existingFileNumbers = new Set(
      existingFormulas.formulas?.map(doc => doc.labelFileNo).filter(Boolean) || []
    );

    let labelFileNo;
    let formattedFileNo;

    if (data.fileNumberUpdated && data.newFileNumber) {
      // Manual file number update - check for duplicates and increment if needed
      let candidateFileNo = data.newFileNumber;

      while (
        existingFileNumbers.has(candidateFileNo) ||
        existingFileNumbers.has(String(candidateFileNo)) ||
        existingFileNumbers.has(Number(candidateFileNo))
      ) {
        console.log("File number already exists, incrementing...");
        candidateFileNo = incrementSuffix(candidateFileNo);
      }

      labelFileNo = candidateFileNo;
    } else {
      // Automatic file number generation
      let fileNo = 100000; // Default starting number

      if (existingFormulas.formulas?.length > 0) {
        const latestFormula = existingFormulas.formulas[0];
        const latestFileNo = latestFormula.FileNo || latestFormula.labelFileNo;
        
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
    const existingFormulas = await FormulaService.fetchAllFormulas();
    
    const existingFileNumbers = new Set(
      existingFormulas.formulas?.map(doc => doc.labelFileNo).filter(Boolean) || []
    );

    return !existingFileNumbers.has(fileNo) && 
           !existingFileNumbers.has(String(fileNo)) && 
           !existingFileNumbers.has(Number(fileNo));
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
