# API Services Documentation

This directory contains the complete API service structure for the MegaPaints application, designed to work with the updated backend API documentation.

## 🏗️ Architecture Overview

The API services are organized into separate, specialized classes that handle different aspects of the application:

- **AdminApiService**: Handles all admin-specific API calls
- **UserApiService**: Handles all user-specific API calls  
- **ProductCatalogService**: Specialized service for product management (admin only)
- **BusinessManagementService**: Specialized service for business operations (admin only)
- **KanbanBoardService**: Specialized service for Kanban board management (admin only) ✨ **NEW**
- **LabelManagementService**: Specialized service for label management (admin only) ✨ **NEW**
- **ApiServiceFactory**: Central factory that manages all services and provides a unified interface

## 📁 File Structure

```
src/services/
├── AdminApiService.js          # Admin API operations
├── UserApiService.js           # User API operations
├── ProductCatalogService.js    # Product management (admin)
├── BusinessManagementService.js # Business operations (admin)
├── KanbanBoardService.js       # Kanban board management (admin) ✨ NEW
├── LabelManagementService.js   # Label management (admin) ✨ NEW
├── ApiServiceFactory.js        # Central service factory
├── index.js                    # Export definitions
└── README.md                   # This documentation
```

## 🚀 Quick Start

### Basic Usage

```javascript
import apiServiceFactory from '../services/ApiServiceFactory.js';

// Initialize services based on user type
const adminServices = apiServiceFactory.initializeAdminServices();
const userServices = apiServiceFactory.initializeUserServices();

// Use services
const products = await adminServices.productCatalog.getProducts();
const userProfile = await userServices.user.getProfile();
```

### Authentication

```javascript
// Admin login
const adminResult = await apiServiceFactory.adminLogin('Admin', '1');

// User login
const userResult = await apiServiceFactory.userLogin('username', 'password');

// User registration
const registerResult = await apiServiceFactory.userRegister({
  username: 'newuser',
  email: 'user@example.com',
  password: 'password123',
  first_name: 'John',
  last_name: 'Doe'
});
```

## 🔧 Service Details

### AdminApiService

Handles all admin-specific API operations including:

- **Authentication**: Login, logout, token refresh, password management
- **Product Catalog**: Categories, products, additives, binders, auxiliaries, accessories, third-party products
- **Business Management**: Branches, users, analytics

```javascript
const adminApi = new AdminApiService();

// Authentication
await adminApi.login('Admin', '1');
await adminApi.logout();
await adminApi.getProfile();

// Product Management
await adminApi.getProducts({ page: 1, limit: 20 });
await adminApi.createProduct(productData);
await adminApi.getAdditives();
await adminApi.getAllItems();

// Business Management
await adminApi.getBranches();
await adminApi.getUsers();
await adminApi.createUser(userData);
```

### UserApiService

Handles all user-specific API operations including:

- **Authentication**: Registration, login, logout, profile management
- **Dashboard**: User dashboard data
- **Formula Management**: Create, read, update, delete formulas
- **Order Management**: Order operations
- **Access Keys**: Access key management
- **File Numbers**: File number management

```javascript
const userApi = new UserApiService();

// Authentication
await userApi.register(userData);
await userApi.login('username', 'password');
await userApi.getProfile();
await userApi.updateProfile(profileData);

// User Operations
await userApi.getDashboard();
await userApi.getFormulas();
await userApi.createFormula(formulaData);
await userApi.getOrders();
await userApi.getAvailableProducts();
```

### KanbanBoardService ✨ **NEW**

Specialized service for admin Kanban board management:

```javascript
const kanbanBoard = new KanbanBoardService(adminApi);

// Board Management
await kanbanBoard.getBoards();
await kanbanBoard.getBoardById(boardId);
await kanbanBoard.createBoard(boardData);
await kanbanBoard.updateBoard(boardId, boardData);
await kanbanBoard.deleteBoard(boardId);
await kanbanBoard.getBoardsByBranch(branchId);

// Board V2 Management
await kanbanBoard.getBranchBoardData();
await kanbanBoard.getBoardStructure();
await kanbanBoard.updateBoardSettings(settings);
await kanbanBoard.getBoardActivity();

// Card Management
await kanbanBoard.getCards();
await kanbanBoard.getCardById(cardId);
await kanbanBoard.createCard(cardData);
await kanbanBoard.updateCard(cardId, cardData);
await kanbanBoard.deleteCard(cardId);
await kanbanBoard.moveCard(cardId, moveData);
await kanbanBoard.archiveCard(cardId);
await kanbanBoard.restoreCard(cardId);
await kanbanBoard.duplicateCard(cardId);

// Column Management
await kanbanBoard.getColumns();
await kanbanBoard.createColumn(columnData);
await kanbanBoard.updateColumn(columnId, columnData);
await kanbanBoard.deleteColumn(columnId);
await kanbanBoard.reorderColumns(columnOrder);

// Comment Management
await kanbanBoard.getCardComments(cardId);
await kanbanBoard.addComment(cardId, commentData);
await kanbanBoard.updateComment(commentId, commentData);
await kanbanBoard.deleteComment(commentId);

// Label Management
await kanbanBoard.getLabels();
await kanbanBoard.createLabel(labelData);
await kanbanBoard.updateLabel(labelId, labelData);
await kanbanBoard.deleteLabel(labelId);

// Analytics & Statistics
await kanbanBoard.getBoardStatistics();
await kanbanBoard.getCardAnalytics();

// Search & Filtering
await kanbanBoard.searchCards(searchTerm);
await kanbanBoard.filterCards(filters);

// Bulk Operations
await kanbanBoard.bulkUpdateCards(cardUpdates);
await kanbanBoard.bulkMoveCards(cardMoves);
```

### LabelManagementService ✨ **NEW**

Specialized service for admin label management:

```javascript
const labelManagement = new LabelManagementService(adminApi);

// Label Management
await labelManagement.getLabels();
await labelManagement.getLabelById(labelId);
await labelManagement.createLabel(labelData);
await labelManagement.updateLabel(labelId, labelData);
await labelManagement.deleteLabel(labelId);
await labelManagement.getLabelsByBoard(boardId);

// Label V2 Management
await labelManagement.getBranchLabels();
await labelManagement.createBranchLabel(labelData);
await labelManagement.updateBranchLabel(labelId, labelData);
await labelManagement.deleteBranchLabel(labelId);

// Label Categories
await labelManagement.getLabelsByCategory('priority');
await labelManagement.getPriorityLabels();
await labelManagement.getStatusLabels();
await labelManagement.getTypeLabels();
await labelManagement.getCustomLabels();

// Color Management
const colors = labelManagement.getAvailableColors();
const randomColor = labelManagement.generateRandomColor();
const textColor = labelManagement.calculateTextColor(backgroundColor);
const isValidColor = labelManagement.validateColor(color);

// Search & Filtering
await labelManagement.searchLabels(searchTerm);
await labelManagement.filterLabels(filters);
await labelManagement.getLabelsByUsage();

// Analytics & Statistics
await labelManagement.getLabelStatistics();
await labelManagement.getLabelUsageAnalytics();

// Bulk Operations
await labelManagement.bulkCreateLabels(labels);
await labelManagement.bulkUpdateLabels(labelUpdates);
await labelManagement.bulkDeleteLabels(labelIds);

// Utility Methods
const validation = labelManagement.validateLabelData(labelData);
const apiData = labelManagement.transformLabelToApi(labelData);
const frontendData = labelManagement.transformLabelFromApi(apiLabel);
const defaultLabels = labelManagement.createDefaultLabels();
const csvData = await labelManagement.exportLabelsToCSV();
```

### ProductCatalogService

Specialized service for admin product management:

```javascript
const productCatalog = new ProductCatalogService(adminApi);

// Categories
await productCatalog.getCategories();
await productCatalog.getRootCategories();
await productCatalog.getSubcategories(parentId);
await productCatalog.createCategory(categoryData);

// Products
await productCatalog.getProducts();
await productCatalog.getProductsByCategory(categoryId);
await productCatalog.getProductsByType('paint');
await productCatalog.createProduct(productData);

// Specialized Products
await productCatalog.getAdditives();
await productCatalog.getBinders();
await productCatalog.getAuxiliaries();
await productCatalog.getAccessories();
await productCatalog.getThirdPartyProducts();

// Unified View
await productCatalog.getAllItems();
await productCatalog.getItemsByType('additive');
await productCatalog.searchAllItems('search term');

// Analytics
await productCatalog.getSummary();
await productCatalog.getCategoryHierarchy();
await productCatalog.getProductStatistics();

// Bulk Operations
await productCatalog.bulkCreateItems(items, 'additive');
await productCatalog.exportItemsToCSV('all');
```

### BusinessManagementService

Specialized service for admin business operations:

```javascript
const businessManagement = new BusinessManagementService(adminApi);

// Branch Management
await businessManagement.getBranches();
await businessManagement.getActiveBranches();
await businessManagement.createBranch(branchData);
await businessManagement.getBranchStatistics(branchId);

// User Management
await businessManagement.getUsers();
await businessManagement.getUsersByBranch(branchId);
await businessManagement.getUsersByDesignation('manager');
await businessManagement.createUser(userData);
await businessManagement.updateUser(userId, userData);
await businessManagement.activateUser(userId);
await businessManagement.deactivateUser(userId);

// Analytics & Reporting
await businessManagement.getBusinessOverview();
await businessManagement.getUserActivityReport();
await businessManagement.getBranchPerformanceReport();

// Bulk Operations
await businessManagement.bulkCreateUsers(users);
await businessManagement.bulkUpdateUserStatus(userIds, true);
await businessManagement.exportUsersToCSV();
await businessManagement.exportBranchesToCSV();

// Validation
const validation = businessManagement.validateUserData(userData);
const branchValidation = businessManagement.validateBranchData(branchData);
```

## 🏭 ApiServiceFactory

The central factory that manages all services:

```javascript
import apiServiceFactory from '../services/ApiServiceFactory.js';

// Service Management
const adminServices = apiServiceFactory.initializeAdminServices();
const userServices = apiServiceFactory.initializeUserServices();
const allServices = apiServiceFactory.getAvailableServices();

// Authentication
await apiServiceFactory.adminLogin('Admin', '1');
await apiServiceFactory.userLogin('username', 'password');
await apiServiceFactory.userRegister(userData);
await apiServiceFactory.logout();

// User Information
const currentUser = apiServiceFactory.getCurrentUser();
const userType = apiServiceFactory.getAuthenticatedUserType();
const userRole = apiServiceFactory.getUserRole();

// Permissions
const hasPermission = apiServiceFactory.hasPermission('products:read');
const hasAnyPermission = apiServiceFactory.hasAnyPermission(['products:read', 'products:create']);
const hasAllPermissions = apiServiceFactory.hasAllPermissions(['users:read', 'users:create']);

// Health Checks
const health = await apiServiceFactory.getHealthCheck();
const detailedHealth = await apiServiceFactory.getDetailedHealthCheck();
```

## 🔐 Authentication Flow

### Admin Authentication

```javascript
// 1. Login
const result = await apiServiceFactory.adminLogin('Admin', '1');

// 2. Initialize services
const adminServices = apiServiceFactory.initializeAdminServices();

// 3. Use services
const products = await adminServices.productCatalog.getProducts();
const users = await adminServices.businessManagement.getUsers();

// 4. Logout
await apiServiceFactory.logout();
```

### User Authentication

```javascript
// 1. Register (optional)
await apiServiceFactory.userRegister(userData);

// 2. Login
const result = await apiServiceFactory.userLogin('username', 'password');

// 3. Initialize services
const userServices = apiServiceFactory.initializeUserServices();

// 4. Use services
const profile = await userServices.user.getProfile();
const formulas = await userServices.user.getFormulas();

// 5. Logout
await apiServiceFactory.logout();
```

## 🛡️ Error Handling

All services include comprehensive error handling:

```javascript
try {
  const products = await adminServices.productCatalog.getProducts();
  console.log('Success:', products.data.products);
} catch (error) {
  console.error('Error:', error.message);
  
  // Handle specific error types
  if (error.message.includes('401')) {
    // Token expired, redirect to login
  } else if (error.message.includes('403')) {
    // Insufficient permissions
  } else if (error.message.includes('404')) {
    // Resource not found
  }
}
```

## 📊 Pagination

Most list endpoints support pagination:

```javascript
// Basic pagination
const products = await adminServices.productCatalog.getProducts({
  page: 1,
  limit: 20
});

// With search and filters
const additives = await adminServices.productCatalog.getAdditives({
  page: 2,
  limit: 10,
  search: 'premium',
  is_active: true
});

// Response includes pagination info
console.log('Total items:', products.data.pagination.total);
console.log('Total pages:', products.data.pagination.pages);
console.log('Current page:', products.data.pagination.page);
```

## 🔍 Search and Filtering

Most services support search and filtering:

```javascript
// Search products
const searchResults = await adminServices.productCatalog.searchProducts('white paint');

// Search users
const userResults = await adminServices.businessManagement.searchUsers('john');

// Filter by type
const paintProducts = await adminServices.productCatalog.getProductsByType('paint');

// Filter by category
const categoryProducts = await adminServices.productCatalog.getProductsByCategory(categoryId);
```

## 📈 Analytics and Reporting

### Product Analytics

```javascript
// Get product summary
const summary = await adminServices.productCatalog.getSummary();

// Get product statistics
const stats = await adminServices.productCatalog.getProductStatistics();

// Get category hierarchy
const hierarchy = await adminServices.productCatalog.getCategoryHierarchy();
```

### Business Analytics

```javascript
// Get business overview
const overview = await adminServices.businessManagement.getBusinessOverview();

// Get user activity report
const activityReport = await adminServices.businessManagement.getUserActivityReport({
  startDate: '2024-01-01',
  endDate: '2024-12-31'
});

// Get branch performance report
const branchReport = await adminServices.businessManagement.getBranchPerformanceReport();
```

## 📤 Export and Bulk Operations

### Export Data

```javascript
// Export products to CSV
const csvData = await adminServices.productCatalog.exportItemsToCSV('all');

// Export users to CSV
const userCsv = await adminServices.businessManagement.exportUsersToCSV();

// Export branches to CSV
const branchCsv = await adminServices.businessManagement.exportBranchesToCSV();
```

### Bulk Operations

```javascript
// Bulk create additives
const bulkResult = await adminServices.productCatalog.bulkCreateItems(additives, 'additive');

// Bulk create users
const userBulkResult = await adminServices.businessManagement.bulkCreateUsers(users);

// Bulk update user status
const statusResult = await adminServices.businessManagement.bulkUpdateUserStatus(
  userIds, 
  true // activate
);
```

## 🧪 Testing and Development

### Health Checks

```javascript
// Basic health check
const health = await apiServiceFactory.getHealthCheck();

// Detailed health check with database status
const detailedHealth = await apiServiceFactory.getDetailedHealthCheck();
```

### Example Component

See `src/components/ApiServiceExample.jsx` for a comprehensive example of how to use all the services.

## 🔧 Configuration

### Base URL

All services use the base URL from the environment:

```javascript
// Default: '/api' (uses Vite proxy)
// Can be configured in individual services if needed
```

### Token Management

Tokens are automatically managed by the services:

- Access tokens are stored in localStorage
- Refresh tokens are used automatically when access tokens expire
- Tokens are cleared on logout

## 🚨 Important Notes

1. **Admin vs User Services**: Admin and user services are completely separate and should not be mixed
2. **Authentication Required**: Most operations require authentication
3. **Permission Checking**: Use the factory's permission methods to check user permissions
4. **Error Handling**: Always wrap API calls in try-catch blocks
5. **Pagination**: Use pagination for large datasets to avoid performance issues
6. **Token Refresh**: The services handle token refresh automatically

## 📚 API Documentation

For complete API endpoint documentation, see the main `api_doc.md` file in the project root.

## 🤝 Contributing

When adding new API endpoints:

1. Add the method to the appropriate service class
2. Update the factory if needed
3. Add examples to the example component
4. Update this documentation

## 🐛 Troubleshooting

### Common Issues

1. **401 Unauthorized**: Check if user is logged in and token is valid
2. **403 Forbidden**: Check user permissions
3. **404 Not Found**: Verify endpoint exists in API documentation
4. **Network Error**: Check if backend is running and CORS is configured

### Debug Mode

Enable debug logging by checking the browser console for detailed API request/response information.
