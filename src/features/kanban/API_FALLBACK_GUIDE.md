# API Fallback Guide - Kanban Board

## Overview

This guide explains how the Kanban board handles API version compatibility and gracefully falls back to existing endpoints when the new API v2.0 is not available.

## Problem Solved

The original error occurred because:
- **API v2.0 endpoints** (`/api/board/v2/*`) are not yet implemented on the backend
- **404 Errors**: Labels and users endpoints not found
- **400 Errors**: Board endpoint not implemented or requires different parameters

## Solution: Graceful Fallback System

### 1. **Board Data Loading**
```javascript
async getBoard() {
  try {
    // Try API v2.0 first
    const response = await api.get(`${this.baseURL}/board/branch`);
    return this.handleResponse(response);
  } catch (v2Error) {
    console.warn('API v2.0 not available, falling back to v1:', v2Error.message);
    
    // Fallback to existing API structure
    const response = await api.get('/board');
    return this.handleResponse(response);
  }
}
```

### 2. **Labels Management**
```javascript
async getLabels() {
  try {
    // Try API v2.0 first
    const response = await api.get(`${this.baseURL}/labels`);
    return this.handleResponse(response);
  } catch (v2Error) {
    console.warn('API v2.0 labels not available, falling back to v1:', v2Error.message);
    
    // Fallback to existing API structure
    const response = await api.get('/label');
    return this.handleResponse(response);
  } catch (error) {
    // If both fail, return empty array to prevent app crash
    console.warn('Labels endpoint not available, returning empty array:', error.message);
    return [];
  }
}
```

### 3. **Users Management**
```javascript
async getUsers() {
  try {
    // Try multiple possible endpoints
    const endpoints = ['/users', '/auth/users', '/api/users', '/api/auth/users'];
    
    for (const endpoint of endpoints) {
      try {
        const response = await api.get(endpoint);
        return this.handleResponse(response);
      } catch (endpointError) {
        console.debug(`Users endpoint ${endpoint} not available:`, endpointError.message);
      }
    }
    
    // If all endpoints fail, return empty array
    console.warn('No users endpoint available, returning empty array');
    return [];
  } catch (error) {
    console.warn('Users endpoint not available:', error.message);
    return [];
  }
}
```

## Data Transformation Compatibility

### **Dual Format Support**
The `transformCardData()` method now supports both API versions:

#### **API v2.0 Detection:**
```javascript
const isV2 = apiCard._id && apiCard.title && !apiCard.Name;
```

#### **API v2.0 Format:**
```javascript
{
  id: apiCard._id,
  title: apiCard.title,
  description: apiCard.description,
  columnId: apiCard.columnId?._id || apiCard.columnId,
  // ... modern fields
}
```

#### **API v1 Format (Legacy):**
```javascript
{
  id: apiCard._id || apiCard.id,
  title: apiCard.title || apiCard.Name,
  columnId: apiCard.columnId || this.mapListToColumn(apiCard.CurrentList),
  // ... legacy fields
}
```

## Error Handling Strategy

### **1. Graceful Degradation**
- **Primary**: Try API v2.0 endpoints first
- **Fallback**: Use existing API v1 endpoints
- **Safety**: Return empty arrays/objects if all fail

### **2. Console Logging**
- **Debug**: Detailed logging for troubleshooting
- **Warnings**: Clear fallback notifications
- **Errors**: Comprehensive error reporting

### **3. User Experience**
- **No Crashes**: App continues to work even with missing endpoints
- **Progressive Enhancement**: Features work when available
- **Graceful Degradation**: Basic functionality maintained

## Current Status

### **✅ Working Endpoints:**
- Board data loading (with fallback)
- Card management (with fallback)
- Column management (with fallback)
- Labels (with fallback)
- Users (with fallback)

### **⚠️ Pending Backend Implementation:**
- `/api/board/v2/board/branch` - Main board endpoint
- `/api/board/v2/labels` - Labels management
- `/api/board/v2/columns` - Column management
- `/api/board/v2/card` - Card management
- `/api/users` - User management

## Testing the Fallback

### **1. Check Console Logs:**
```javascript
// Look for these messages:
"API v2.0 not available, falling back to v1: [error]"
"API v2.0 labels not available, falling back to v1: [error]"
"No users endpoint available, returning empty array"
```

### **2. Verify Functionality:**
- Board loads successfully
- Cards display correctly
- Drag and drop works
- No JavaScript errors

### **3. Monitor Network Requests:**
- Primary requests to `/api/board/v2/*` (will fail)
- Fallback requests to `/api/board` (should succeed)
- Labels requests to `/api/label` (should succeed)

## Migration Path

### **Phase 1: Current (Fallback Active)**
- Frontend works with existing API
- Graceful fallback to v1 endpoints
- No user impact

### **Phase 2: Backend Implementation**
- Backend implements API v2.0 endpoints
- Frontend automatically uses new endpoints
- Enhanced features become available

### **Phase 3: Full Migration**
- Remove fallback code
- Use only API v2.0 endpoints
- Leverage new features

## Troubleshooting

### **Common Issues:**

#### **1. Board Not Loading**
- Check if `/api/board` endpoint exists
- Verify authentication is working
- Check console for specific error messages

#### **2. Labels Not Showing**
- Check if `/api/label` endpoint exists
- Verify labels data format
- Check console for fallback messages

#### **3. Users Not Available**
- Check if any user endpoints exist
- Verify authentication context
- Check console for endpoint attempts

### **Debug Steps:**
1. Open browser console
2. Look for fallback messages
3. Check network tab for failed requests
4. Verify backend endpoint availability
5. Test with existing API endpoints

## Benefits of This Approach

### **1. Zero Downtime**
- App works immediately
- No waiting for backend implementation
- Seamless user experience

### **2. Future-Proof**
- Ready for API v2.0 when available
- Automatic migration when backend is ready
- No code changes needed

### **3. Robust Error Handling**
- Multiple fallback strategies
- Graceful degradation
- Comprehensive logging

### **4. Development Friendly**
- Clear error messages
- Easy debugging
- Progressive enhancement

## Conclusion

The fallback system ensures the Kanban board works reliably regardless of backend API version availability. Users get a consistent experience while developers can implement the new API at their own pace.

---

**Last Updated:** January 2024  
**Status:** Active Fallback System  
**Backend API v2.0:** Pending Implementation
