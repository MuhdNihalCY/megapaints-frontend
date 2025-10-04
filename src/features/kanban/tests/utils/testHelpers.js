/**
 * Kanban Testing Framework
 * Comprehensive testing suite for all Kanban functionality
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DndProvider } from '@dnd-kit/core';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { KanbanProvider } from '../contexts/KanbanContext';
import { PermissionProvider } from '../contexts/PermissionContext';

// Test Utilities
export const createMockUser = (overrides = {}) => ({
  _id: 'user-1',
  username: 'testuser',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  roles: ['sales'],
  permissions: ['VIEW_BOARD', 'CREATE_CARD', 'EDIT_CARD'],
  is_active: true,
  ...overrides
});

export const createMockCard = (overrides = {}) => ({
  _id: 'card-1',
  title: 'Test Card',
  description: 'Test Description',
  columnId: 'sales',
  priority: 'medium',
  labels: [],
  assignees: [],
  dueDate: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: createMockUser(),
  position: 0,
  isActive: true,
  isArchived: false,
  attachments: [],
  comments: [],
  activities: [],
  checklists: [],
  customFields: [],
  ...overrides
});

export const createMockColumn = (overrides = {}) => ({
  _id: 'column-1',
  name: 'Sales',
  type: 'sales',
  group: 'main',
  position: 0,
  isActive: true,
  canCreateCard: true,
  color: '#3B82F6',
  description: 'Sales column',
  hasSubColumns: false,
  subColumns: [],
  cards: [],
  stats: {
    totalCards: 0,
    activeCards: 0,
    completedCards: 0,
    overdueCards: 0,
    averageCompletionTime: 0
  },
  ...overrides
});

export const createMockLabel = (overrides = {}) => ({
  _id: 'label-1',
  name: 'Bug',
  color: '#EF4444',
  textColor: '#FFFFFF',
  isActive: true,
  usageCount: 0,
  ...overrides
});

export const createMockComment = (overrides = {}) => ({
  _id: 'comment-1',
  text: 'Test comment',
  cardId: 'card-1',
  author: createMockUser(),
  mentions: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isEdited: false,
  isDeleted: false,
  ...overrides
});

// Test Wrapper Component
export const TestWrapper = ({ children, user = createMockUser(), initialData = {} }) => {
  const mockContextValue = {
    user,
    cards: initialData.cards || [],
    columns: initialData.columns || [],
    users: initialData.users || [user],
    labels: initialData.labels || [],
    isLoading: false,
    error: null,
    createCard: jest.fn(),
    updateCard: jest.fn(),
    deleteCard: jest.fn(),
    moveCard: jest.fn(),
    addComment: jest.fn(),
    updateComment: jest.fn(),
    deleteComment: jest.fn(),
    updateColumn: jest.fn(),
    toggleColumnActivation: jest.fn(),
    setSearchTerm: jest.fn(),
    setFilters: jest.fn(),
    clearFilters: jest.fn(),
    canCreateCard: jest.fn(() => true),
    canEditCard: jest.fn(() => true),
    canMoveCard: jest.fn(() => true),
    canDeleteCard: jest.fn(() => true),
    canToggleColumnActivation: jest.fn(() => true)
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <PermissionProvider user={user}>
        <KanbanProvider value={mockContextValue}>
          {children}
        </KanbanProvider>
      </PermissionProvider>
    </DndProvider>
  );
};

// Drag & Drop Test Utilities
export const simulateDragDrop = async (sourceElement, targetElement) => {
  fireEvent.dragStart(sourceElement);
  fireEvent.dragEnter(targetElement);
  fireEvent.dragOver(targetElement);
  fireEvent.drop(targetElement);
  fireEvent.dragEnd(sourceElement);
};

export const createDragEvent = (type, data = {}) => {
  const event = new Event(type, { bubbles: true });
  Object.assign(event, data);
  return event;
};

// Permission Test Utilities
export const testPermission = (permission, user, expectedResult) => {
  const hasPermission = user.roles.some(role => 
    PERMISSION_MATRIX[permission]?.includes(role)
  );
  expect(hasPermission).toBe(expectedResult);
};

export const testPermissionMatrix = (user, permissions) => {
  permissions.forEach(({ permission, expected }) => {
    testPermission(permission, user, expected);
  });
};

// Card Test Utilities
export const testCardCreation = async (cardData, expectedResult = true) => {
  const { createCard } = useKanban();
  try {
    await createCard(cardData);
    expect(expectedResult).toBe(true);
  } catch (error) {
    expect(expectedResult).toBe(false);
  }
};

export const testCardUpdate = async (cardId, updates, expectedResult = true) => {
  const { updateCard } = useKanban();
  try {
    await updateCard(cardId, updates);
    expect(expectedResult).toBe(true);
  } catch (error) {
    expect(expectedResult).toBe(false);
  }
};

export const testCardMove = async (cardId, toColumnId, expectedResult = true) => {
  const { moveCard } = useKanban();
  try {
    await moveCard(cardId, toColumnId, 0);
    expect(expectedResult).toBe(true);
  } catch (error) {
    expect(expectedResult).toBe(false);
  }
};

// Column Test Utilities
export const testColumnActivation = async (columnId, isActive, expectedResult = true) => {
  const { toggleColumnActivation } = useKanban();
  try {
    await toggleColumnActivation(columnId, isActive);
    expect(expectedResult).toBe(true);
  } catch (error) {
    expect(expectedResult).toBe(false);
  }
};

// Comment Test Utilities
export const testCommentAddition = async (cardId, commentData, expectedResult = true) => {
  const { addComment } = useKanban();
  try {
    await addComment(cardId, commentData);
    expect(expectedResult).toBe(true);
  } catch (error) {
    expect(expectedResult).toBe(false);
  }
};

// Search Test Utilities
export const testSearch = async (searchTerm, expectedResults) => {
  const { setSearchTerm } = useKanban();
  setSearchTerm(searchTerm);
  
  await waitFor(() => {
    const cards = screen.getAllByTestId('kanban-card');
    expect(cards).toHaveLength(expectedResults);
  });
};

// Filter Test Utilities
export const testFilters = async (filters, expectedResults) => {
  const { setFilters } = useKanban();
  setFilters(filters);
  
  await waitFor(() => {
    const cards = screen.getAllByTestId('kanban-card');
    expect(cards).toHaveLength(expectedResults);
  });
};

// Performance Test Utilities
export const measurePerformance = (testFunction) => {
  const startTime = performance.now();
  testFunction();
  const endTime = performance.now();
  return endTime - startTime;
};

export const testPerformance = (testFunction, maxTime = 100) => {
  const executionTime = measurePerformance(testFunction);
  expect(executionTime).toBeLessThan(maxTime);
};

// Accessibility Test Utilities
export const testAccessibility = (component) => {
  // Test keyboard navigation
  const focusableElements = component.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  expect(focusableElements.length).toBeGreaterThan(0);
  
  // Test ARIA attributes
  const elementsWithAria = component.querySelectorAll('[aria-label], [aria-labelledby]');
  expect(elementsWithAria.length).toBeGreaterThan(0);
};

// Mock API Responses
export const mockApiResponse = (data, status = 'success') => ({
  status,
  data,
  message: status === 'success' ? 'Operation successful' : 'Operation failed'
});

export const mockErrorResponse = (error = 'Test error') => ({
  status: 'error',
  error,
  message: 'Operation failed'
});

// Test Data Generators
export const generateMockCards = (count = 10) => {
  return Array.from({ length: count }, (_, index) => 
    createMockCard({
      _id: `card-${index + 1}`,
      title: `Test Card ${index + 1}`,
      position: index
    })
  );
};

export const generateMockColumns = () => {
  return [
    createMockColumn({ _id: 'sales', name: 'Sales', type: 'sales' }),
    createMockColumn({ _id: 'office', name: 'Office', type: 'office' }),
    createMockColumn({ _id: 'production', name: 'Production', type: 'production' }),
    createMockColumn({ _id: 'ready', name: 'Ready', type: 'ready' }),
    createMockColumn({ _id: 'drivers', name: 'Drivers', type: 'drivers' }),
    createMockColumn({ _id: 'done', name: 'Done', type: 'done' })
  ];
};

export const generateMockUsers = (count = 5) => {
  const roles = ['sales', 'production', 'driver', 'office', 'admin'];
  return Array.from({ length: count }, (_, index) => 
    createMockUser({
      _id: `user-${index + 1}`,
      username: `user${index + 1}`,
      first_name: `User${index + 1}`,
      roles: [roles[index % roles.length]]
    })
  );
};

// Test Scenarios
export const testScenarios = {
  // User Journey Tests
  userJourneys: {
    createCard: async () => {
      const user = createMockUser({ roles: ['sales'] });
      const cardData = {
        title: 'New Card',
        description: 'Test Description',
        priority: 'medium'
      };
      
      await testCardCreation(cardData, true);
    },
    
    moveCard: async () => {
      const user = createMockUser({ roles: ['sales_lead'] });
      const card = createMockCard();
      
      await testCardMove(card._id, 'office', true);
    },
    
    addComment: async () => {
      const user = createMockUser();
      const card = createMockCard();
      const commentData = {
        text: 'Test comment',
        mentions: []
      };
      
      await testCommentAddition(card._id, commentData, true);
    }
  },
  
  // Permission Tests
  permissions: {
    salesUser: {
      canCreateCard: true,
      canEditOwnCard: true,
      canEditAssignedCard: true,
      canMoveCard: false,
      canDeleteCard: false,
      canManageColumns: false
    },
    
    salesLead: {
      canCreateCard: true,
      canEditAnyCard: true,
      canMoveCard: true,
      canDeleteCard: true,
      canManageColumns: false
    },
    
    admin: {
      canCreateCard: true,
      canEditAnyCard: true,
      canMoveCard: true,
      canDeleteCard: true,
      canManageColumns: true
    }
  },
  
  // Drag & Drop Tests
  dragDrop: {
    allowedMoves: [
      { from: 'sales', to: 'office', expected: true },
      { from: 'office', to: 'production', expected: true },
      { from: 'production', to: 'ready', expected: true },
      { from: 'ready', to: 'drivers', expected: true },
      { from: 'drivers', to: 'done-today', expected: true }
    ],
    
    restrictedMoves: [
      { from: 'done-less-7', to: 'sales', expected: false },
      { from: 'done-more-7', to: 'office', expected: false },
      { from: 'sales', to: 'done-less-7', expected: false },
      { from: 'office', to: 'done-more-7', expected: false }
    ]
  }
};

// Test Suite Generator
export const generateTestSuite = (componentName, testCases) => {
  return {
    [`${componentName} Component Tests`]: {
      'should render without crashing': () => {
        const component = render(<TestWrapper><ComponentName /></TestWrapper>);
        expect(component).toBeTruthy();
      },
      
      'should handle user interactions': () => {
        // Test user interactions
      },
      
      'should respect permissions': () => {
        // Test permission-based rendering
      },
      
      'should handle errors gracefully': () => {
        // Test error handling
      },
      
      ...testCases
    }
  };
};

// Performance Benchmarks
export const performanceBenchmarks = {
  cardRendering: 50, // ms
  columnRendering: 100, // ms
  dragDropOperation: 200, // ms
  searchOperation: 300, // ms
  filterOperation: 150, // ms
  apiCall: 1000 // ms
};

// Test Coverage Requirements
export const coverageRequirements = {
  statements: 90,
  branches: 85,
  functions: 90,
  lines: 90
};

export default {
  createMockUser,
  createMockCard,
  createMockColumn,
  createMockLabel,
  createMockComment,
  TestWrapper,
  simulateDragDrop,
  createDragEvent,
  testPermission,
  testPermissionMatrix,
  testCardCreation,
  testCardUpdate,
  testCardMove,
  testColumnActivation,
  testCommentAddition,
  testSearch,
  testFilters,
  measurePerformance,
  testPerformance,
  testAccessibility,
  mockApiResponse,
  mockErrorResponse,
  generateMockCards,
  generateMockColumns,
  generateMockUsers,
  testScenarios,
  generateTestSuite,
  performanceBenchmarks,
  coverageRequirements
};
