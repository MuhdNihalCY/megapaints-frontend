/**
 * Services Index
 * Central export point for all API services
 */

// Core Services
import AdminApiService from './AdminApiService.js';
import UserApiService from './UserApiService.js';
import ProductCatalogService from './ProductCatalogService.js';
import BusinessManagementService from './BusinessManagementService.js';
import KanbanBoardService from './KanbanBoardService.js';
import LabelManagementService from './LabelManagementService.js';
import ApiServiceFactory from './ApiServiceFactory.js';

// Export individual services
export {
  AdminApiService,
  UserApiService,
  ProductCatalogService,
  BusinessManagementService,
  KanbanBoardService,
  LabelManagementService,
  ApiServiceFactory
};

// Export factory as default
export default ApiServiceFactory;
