import api from './api';

/**
 * API Endpoint Test Utility
 * 
 * This utility helps test different API endpoints to find the correct one
 * for fetching formulas and other data.
 */

export const testEndpoints = {
  /**
   * Test various formula endpoints to find the correct one
   */
  async testFormulaEndpoints() {
    const endpoints = [
      '/v1/formulations/formula',  // New correct endpoint
      '/v1/formula',
      '/admin/formula',
      '/formula',
      '/v1/formulas',
      '/admin/formulas',
      '/formulas'
    ];

    console.log('🔍 Testing formula endpoints...');
    
    for (const endpoint of endpoints) {
      try {
        console.log(`Testing: ${endpoint}`);
        const response = await api.get(endpoint, {
          params: { page: 1, limit: 10 },
          timeout: 5000
        });
        
        console.log(`✅ SUCCESS: ${endpoint}`);
        console.log('Response structure:', {
          status: response.status,
          hasData: !!response.data,
          dataKeys: response.data ? Object.keys(response.data) : [],
          sampleData: response.data ? JSON.stringify(response.data).slice(0, 200) + '...' : 'No data'
        });
        
        return {
          success: true,
          endpoint,
          data: response.data
        };
      } catch (error) {
        console.log(`❌ FAILED: ${endpoint} - ${error.response?.status || error.message}`);
      }
    }
    
    console.log('❌ No working formula endpoints found');
    return {
      success: false,
      endpoint: null,
      data: null
    };
  },

  /**
   * Test master data endpoints
   */
  async testMasterEndpoints() {
    const endpoints = [
      '/v1/category',
      '/v1/subcategory',
      '/v1/product',
      '/v1/additive'
    ];

    console.log('🔍 Testing master data endpoints...');
    
    const results = {};
    
    for (const endpoint of endpoints) {
      try {
        console.log(`Testing: ${endpoint}`);
        const response = await api.get(endpoint, {
          params: { page: 1, limit: 10 },
          timeout: 5000
        });
        
        console.log(`✅ SUCCESS: ${endpoint}`);
        results[endpoint] = {
          success: true,
          status: response.status,
          hasData: !!response.data,
          dataKeys: response.data ? Object.keys(response.data) : []
        };
      } catch (error) {
        console.log(`❌ FAILED: ${endpoint} - ${error.response?.status || error.message}`);
        results[endpoint] = {
          success: false,
          error: error.response?.status || error.message
        };
      }
    }
    
    return results;
  },

  /**
   * Test authentication endpoints
   */
  async testAuthEndpoints() {
    const endpoints = [
      '/auth/refresh',
      '/admin/auth/refresh',
      '/auth/status',
      '/admin/auth/status'
    ];

    console.log('🔍 Testing auth endpoints...');
    
    const results = {};
    
    for (const endpoint of endpoints) {
      try {
        console.log(`Testing: ${endpoint}`);
        const response = await api.post(endpoint, {}, {
          timeout: 5000,
          _noIntercept: true
        });
        
        console.log(`✅ SUCCESS: ${endpoint}`);
        results[endpoint] = {
          success: true,
          status: response.status,
          hasData: !!response.data
        };
      } catch (error) {
        console.log(`❌ FAILED: ${endpoint} - ${error.response?.status || error.message}`);
        results[endpoint] = {
          success: false,
          error: error.response?.status || error.message
        };
      }
    }
    
    return results;
  }
};

/**
 * Run all endpoint tests
 */
export async function runAllTests() {
  console.log('🚀 Starting API endpoint tests...\n');
  
  const results = {
    formulas: await testEndpoints.testFormulaEndpoints(),
    masters: await testEndpoints.testMasterEndpoints(),
    auth: await testEndpoints.testAuthEndpoints()
  };
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  if (results.formulas.success) {
    console.log(`✅ Formula endpoint found: ${results.formulas.endpoint}`);
  } else {
    console.log('❌ No working formula endpoint found');
  }
  
  const workingMasters = Object.entries(results.masters).filter(([_, result]) => result.success);
  console.log(`✅ Working master endpoints: ${workingMasters.length}/${Object.keys(results.masters).length}`);
  
  const workingAuth = Object.entries(results.auth).filter(([_, result]) => result.success);
  console.log(`✅ Working auth endpoints: ${workingAuth.length}/${Object.keys(results.auth).length}`);
  
  return results;
}

// Auto-run tests if this file is imported directly
if (typeof window !== 'undefined') {
  // Only run in browser environment
  window.testAPIEndpoints = runAllTests;
  console.log('🔧 API test utility loaded. Run window.testAPIEndpoints() to test endpoints.');
}
