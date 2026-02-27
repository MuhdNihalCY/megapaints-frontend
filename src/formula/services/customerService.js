/**
 * Customer Service
 * Handles customer data fetching and management for formula creation
 * 
 * @module customerService
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

/**
 * Customer Service
 * Provides methods for interacting with customer data
 */
export class CustomerService {
  /**
   * Fetches all customer names for autocomplete functionality
   * Corresponds to legacy fetchAllCustomerName() function
   * 
   * @returns {Promise<string[]>} Array of customer names
   * @throws {Error} If the fetch request fails
   * 
   * @example
   * const names = await CustomerService.fetchAllCustomerNames();
   * // names = ["John Doe", "Jane Smith", "Acme Corp"]
   */
  static async fetchAllCustomerNames() {
    try {
      const response = await fetch(`${API_BASE}/getall/customer/api`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch customer names: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Ensure we return an array of strings
      if (Array.isArray(data)) {
        return data.filter(name => typeof name === 'string' && name.trim());
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching customer names:', error);
      return []; // Return empty array on error to prevent app crash
    }
  }
}
