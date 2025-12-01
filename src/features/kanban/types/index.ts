/**
 * TypeScript Type Definitions for Kanban Board System
 */

// User Types
export interface User {
  _id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  designation: string;
  roles: string[];
  permissions: string[];
  branches: string[];
  is_active: boolean;
  last_login?: string;
  createdAt: string;
  updatedAt: string;
}

// Card Types
export interface Card {
  _id: string;
  title: string;
  description?: string;
  cardId?: string;
  columnId: string;
  subcolumnId?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  labels: Label[];
  assignees: User[];
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: User;
  updatedBy?: User;
  position: number;
  isActive: boolean;
  isArchived: boolean;
  attachments: Attachment[];
  comments: Comment[];
  activities: Activity[];
  checklists: Checklist[];
  customFields: CustomField[];
  contacts?: Contact[];
  readyProducts?: ReadyProduct[];
}

// Column Types
export interface Column {
  _id: string;
  name: string;
  type: string;
  group: 'main' | 'grouped';
  position: number;
  isActive: boolean;
  canCreateCard: boolean;
  color: string;
  description?: string;
  hasSubColumns: boolean;
  subColumns: SubColumn[];
  cards: Card[];
  stats: ColumnStats;
}

export interface SubColumn {
  id: string;
  name: string;
  position: number;
  isActive: boolean;
  isRestricted?: boolean;
  hasSearch?: boolean;
  cards: Card[];
}

// Label Types
export interface Label {
  _id: string;
  id?: string;
  name: string;
  color: string;
  textColor?: string;
  text_color?: string;
  branchId?: string;
  branch_id?: string;
  boardId?: string;
  board_id?: string;
  category?: string;
  description?: string;
  isActive?: boolean;
  is_active?: boolean;
  usageCount?: number;
  usage_count?: number;
  sortOrder?: number;
  sort_order?: number;
}

// Comment Types
export interface Comment {
  _id: string;
  text: string;
  cardId: string;
  author: User;
  mentions: User[];
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
  isDeleted: boolean;
}

// Activity Types
export interface Activity {
  _id: string;
  type: string;
  cardId: string;
  userId: string;
  user: User;
  timestamp: string;
  data: ActivityData;
  before?: any;
  after?: any;
}

export interface ActivityData {
  action: string;
  description: string;
  metadata?: Record<string, any>;
}

// Attachment Types
export interface Attachment {
  _id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedBy: User;
  uploadedAt: string;
}

// Checklist Types
export interface Checklist {
  _id: string;
  title: string;
  items: ChecklistItem[];
  cardId: string;
  position: number;
}

export interface ChecklistItem {
  _id: string;
  text: string;
  isCompleted: boolean;
  completedBy?: User;
  completedAt?: string;
  position: number;
}

// Custom Field Types
export interface CustomField {
  _id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean';
  value: any;
  options?: string[];
  isRequired: boolean;
}

// Contact Types
export interface Contact {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  company?: string;
  position?: string;
}

// Ready Product Types
export interface ReadyProduct {
  product_id: string;
  product_name: string;
  product_code: string;
  quantity: number;
  unit: string;
  added_at?: string;
  added_by?: string;
  // Legacy fields for compatibility
  _id?: string;
  name?: string;
  code?: string;
  notes?: string;
}

// Permission Types
export interface Permission {
  id: string;
  name: string;
  description: string;
  roles: string[];
}

export interface PermissionCheck {
  hasPermission: boolean;
  reason?: string;
  requiredRole?: string;
}

// Filter Types
export interface Filter {
  id: string;
  name: string;
  type: 'text' | 'label' | 'assignee' | 'dueDate' | 'priority' | 'column';
  value: any;
  operator?: 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'between';
}

export interface FilterState {
  text: string;
  labels: string[];
  assignees: string[];
  dueDateRange: {
    start?: string;
    end?: string;
  };
  priority: string[];
  columns: string[];
}

// Search Types
export interface SearchResult {
  cards: Card[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface SearchParams {
  query: string;
  columnId?: string;
  filters?: FilterState;
  page?: number;
  limit?: number;
}

// Drag & Drop Types
export interface DragDropData {
  cardId: string;
  fromColumnId: string;
  toColumnId: string;
  fromPosition: number;
  toPosition: number;
  fromSubColumnId?: string;
  toSubColumnId?: string;
}

export interface DragDropResult {
  success: boolean;
  error?: string;
  rollbackData?: DragDropData;
}

// Modal Types
export interface ModalState {
  isOpen: boolean;
  mode: 'create' | 'edit' | 'view';
  cardId?: string;
  columnId?: string;
  data?: Partial<Card>;
}

// Board State Types
export interface BoardState {
  cards: Card[];
  columns: Column[];
  users: User[];
  labels: Label[];
  filters: FilterState;
  searchTerm: string;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string;
}

// API Response Types
export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Form Types
export interface CardFormData {
  title: string;
  description?: string;
  priority: string;
  labels: string[];
  assignees: string[];
  dueDate?: string;
  customFields: CustomField[];
  attachments: File[];
}

export interface CommentFormData {
  text: string;
  mentions: string[];
}

// Statistics Types
export interface ColumnStats {
  totalCards: number;
  activeCards: number;
  completedCards: number;
  overdueCards: number;
  averageCompletionTime: number;
}

export interface BoardStats {
  totalCards: number;
  totalColumns: number;
  totalUsers: number;
  completionRate: number;
  averageCardsPerColumn: number;
  mostActiveColumn: string;
  leastActiveColumn: string;
}

// Event Types
export interface KanbanEvent {
  type: string;
  payload: any;
  timestamp: string;
  userId: string;
}

// Hook Return Types
export interface UseKanbanReturn {
  // State
  cards: Card[];
  columns: Column[];
  users: User[];
  labels: Label[];
  filters: FilterState;
  searchTerm: string;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  createCard: (cardData: CardFormData) => Promise<void>;
  updateCard: (cardId: string, updates: Partial<Card>) => Promise<void>;
  deleteCard: (cardId: string) => Promise<void>;
  moveCard: (cardId: string, toColumnId: string, toPosition: number) => Promise<void>;
  
  // Comments
  addComment: (cardId: string, commentData: CommentFormData) => Promise<void>;
  updateComment: (commentId: string, updates: Partial<Comment>) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  
  // Columns
  updateColumn: (columnId: string, updates: Partial<Column>) => Promise<void>;
  toggleColumnActivation: (columnId: string, isActive: boolean) => Promise<void>;
  
  // Search & Filters
  setSearchTerm: (term: string) => void;
  setFilters: (filters: FilterState) => void;
  clearFilters: () => void;
  
  // Permissions
  canCreateCard: (columnId: string) => boolean;
  canEditCard: (card: Card) => boolean;
  canMoveCard: (card: Card, toColumnId: string) => boolean;
  canDeleteCard: (card: Card) => boolean;
  canToggleColumnActivation: (columnId: string) => boolean;
}

// Service Types
export interface KanbanService {
  // Cards
  getCards: (params?: any) => Promise<ApiResponse<Card[]>>;
  getCard: (cardId: string) => Promise<ApiResponse<Card>>;
  createCard: (cardData: CardFormData) => Promise<ApiResponse<Card>>;
  updateCard: (cardId: string, updates: Partial<Card>) => Promise<ApiResponse<Card>>;
  deleteCard: (cardId: string) => Promise<ApiResponse<void>>;
  moveCard: (cardId: string, moveData: DragDropData) => Promise<ApiResponse<Card>>;
  
  // Columns
  getColumns: () => Promise<ApiResponse<Column[]>>;
  updateColumn: (columnId: string, updates: Partial<Column>) => Promise<ApiResponse<Column>>;
  toggleColumnActivation: (columnId: string, isActive: boolean) => Promise<ApiResponse<Column>>;
  
  // Comments
  getComments: (cardId: string) => Promise<ApiResponse<Comment[]>>;
  addComment: (cardId: string, commentData: CommentFormData) => Promise<ApiResponse<Comment>>;
  updateComment: (commentId: string, updates: Partial<Comment>) => Promise<ApiResponse<Comment>>;
  deleteComment: (commentId: string) => Promise<ApiResponse<void>>;
  
  // Users
  getUsers: () => Promise<ApiResponse<User[]>>;
  
  // Labels
  getLabels: () => Promise<ApiResponse<Label[]>>;
  
  // Search
  searchCards: (params: SearchParams) => Promise<ApiResponse<SearchResult>>;
  
  // Activities
  getActivities: (cardId: string) => Promise<ApiResponse<Activity[]>>;
  logActivity: (activityData: Partial<Activity>) => Promise<ApiResponse<Activity>>;
}

export default {
  User,
  Card,
  Column,
  SubColumn,
  Label,
  Comment,
  Activity,
  ActivityData,
  Attachment,
  Checklist,
  ChecklistItem,
  CustomField,
  Contact,
  ReadyProduct,
  Permission,
  PermissionCheck,
  Filter,
  FilterState,
  SearchResult,
  SearchParams,
  DragDropData,
  DragDropResult,
  ModalState,
  BoardState,
  ApiResponse,
  PaginatedResponse,
  CardFormData,
  CommentFormData,
  ColumnStats,
  BoardStats,
  KanbanEvent,
  UseKanbanReturn,
  KanbanService
};
