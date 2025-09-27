# Column Sorting Guide

## Overview
Each column in the Kanban board now supports comprehensive sorting functionality with multiple sort options including priority, time-based sorting, and custom ordering.

## Features

### 🎯 Sort Options Available

#### **Priority Sorting**
- **Urgent** → **High** → **Medium** → **Low**
- Ascending: Low to High priority
- Descending: High to Low priority

#### **Time-Based Sorting**
- **Created Date**: Sort by when cards were created
- **Last Updated**: Sort by when cards were last modified
- **Due Date**: Sort by due dates (overdue cards first)

#### **Content Sorting**
- **Title**: Alphabetical sorting (A-Z or Z-A)
- **Assignees**: Sort by number of assignees
- **Labels**: Sort by number of labels

#### **Custom Order**
- **Manual**: Drag and drop order (default for most columns)
- Preserves the order you set by dragging cards

### 🎨 UI Components

#### **Sort Dropdown**
- Located in each column header
- Shows current sort option with icon
- Two-step selection: Option → Direction
- Reset to default option available

#### **Visual Indicators**
- Current sort option displayed in dropdown
- Sort direction shown with arrows
- Card count updates in real-time
- Smooth animations for all interactions

### 🔧 Default Sort Options by Column Type

| Column Type | Default Sort | Reason |
|-------------|--------------|---------|
| **Sales** | Created Date | Show newest orders first |
| **Office** | Priority | Focus on urgent tasks |
| **Production** | Priority | Prioritize urgent production items |
| **Ready** | Due Date | Show items due soonest first |
| **Drivers** | Due Date | Deliver urgent items first |
| **Done** | Last Updated | Show recently completed items |

## Usage

### Basic Sorting
1. **Click the sort dropdown** in any column header
2. **Select a sort option** (Priority, Created Date, etc.)
3. **Choose direction** (High to Low, A to Z, etc.)
4. **Cards automatically reorder** in the column

### Custom Order
1. **Select "Custom Order"** from sort options
2. **Drag and drop cards** to arrange them manually
3. **Order is preserved** until you change the sort option

### Reset to Default
1. **Click "Reset to Default"** in the sort dropdown
2. **Column returns** to its default sort option
3. **Useful for** quickly returning to standard view

## Technical Implementation

### Sort Functions
```javascript
// Available sort functions
import { 
  sortCards, 
  SORT_OPTIONS, 
  getDefaultSortOption 
} from './utils/sorting';

// Sort cards with specific option and direction
const sortedCards = sortCards(cards, 'priority', 'desc');
```

### Context Integration
```javascript
// Access sorting functions from context
const {
  setColumnSort,
  resetColumnSort,
  getColumnSort,
  getSortedCardsByColumn,
  getSortedCardsBySubcolumn
} = useKanban();

// Set sort for a column
setColumnSort('sales', 'priority', 'desc');

// Get current sort config
const sortConfig = getColumnSort('sales');
// Returns: { sortOption: 'priority', direction: 'desc' }
```

### Component Usage
```jsx
// Use sorted cards in components
const sortedCards = getSortedCardsByColumn(columnId);

// Or use the hook directly
const { getSortedCardsByColumn } = useKanban();
const cards = getSortedCardsByColumn('sales');
```

## Sort Options Reference

### Priority Sorting
```javascript
SORT_OPTIONS.PRIORITY = {
  id: 'priority',
  label: 'Priority',
  description: 'Sort by priority (Urgent → High → Medium → Low)',
  icon: '⚡'
}
```

### Time Sorting
```javascript
SORT_OPTIONS.CREATED_DATE = {
  id: 'createdDate',
  label: 'Created Date',
  description: 'Sort by creation date',
  icon: '📅'
}

SORT_OPTIONS.UPDATED_DATE = {
  id: 'updatedDate',
  label: 'Last Updated',
  description: 'Sort by last update date',
  icon: '🔄'
}

SORT_OPTIONS.DUE_DATE = {
  id: 'dueDate',
  label: 'Due Date',
  description: 'Sort by due date',
  icon: '⏰'
}
```

### Content Sorting
```javascript
SORT_OPTIONS.TITLE = {
  id: 'title',
  label: 'Title',
  description: 'Sort alphabetically by title',
  icon: '🔤'
}

SORT_OPTIONS.ASSIGNEES = {
  id: 'assignees',
  label: 'Assignees',
  description: 'Sort by number of assignees',
  icon: '👥'
}

SORT_OPTIONS.LABELS = {
  id: 'labels',
  label: 'Labels',
  description: 'Sort by number of labels',
  icon: '🏷️'
}
```

### Custom Order
```javascript
SORT_OPTIONS.CUSTOM = {
  id: 'custom',
  label: 'Custom Order',
  description: 'Manual drag and drop order',
  icon: '↕️'
}
```

## Sort Directions

### High to Low / Low to High
- **Priority**: Urgent → High → Medium → Low
- **Created Date**: Newest → Oldest
- **Updated Date**: Most Recent → Oldest
- **Assignees**: Most → Fewest
- **Labels**: Most → Fewest

### A to Z / Z to A
- **Title**: Alphabetical order

### Earliest First / Latest First
- **Due Date**: Overdue → Due Soon → Future

## Advanced Features

### Subcolumn Sorting
- **Grouped columns** (Production, Ready, Drivers, Done) apply sort to all subcolumns
- **Consistent ordering** across all subcolumns in a group
- **Individual subcolumns** inherit parent column sort settings

### Sort Persistence
- **Sort preferences** are maintained during the session
- **Reset to default** available for each column
- **State management** through React Context

### Performance Optimization
- **Memoized sort functions** for better performance
- **Efficient re-rendering** only when sort changes
- **Lazy evaluation** of sort results

## Customization

### Adding New Sort Options
```javascript
// Add to SORT_OPTIONS in sorting.js
export const SORT_OPTIONS = {
  // ... existing options
  CUSTOM_FIELD: {
    id: 'customField',
    label: 'Custom Field',
    description: 'Sort by custom field',
    icon: '🔧'
  }
};

// Add sort function
export const sortByCustomField = (cards, direction = 'asc') => {
  return [...cards].sort((a, b) => {
    const aValue = a.customField || '';
    const bValue = b.customField || '';
    
    if (direction === 'asc') {
      return aValue.localeCompare(bValue);
    }
    return bValue.localeCompare(aValue);
  });
};
```

### Custom Sort Directions
```javascript
// Add to getSortDirections function
export const getSortDirections = (sortOption) => {
  switch (sortOption) {
    case SORT_OPTIONS.CUSTOM_FIELD.id:
      return [
        { id: 'asc', label: 'A to Z', icon: '⬆️' },
        { id: 'desc', label: 'Z to A', icon: '⬇️' }
      ];
    // ... other cases
  }
};
```

## Best Practices

### When to Use Each Sort
- **Priority**: When focusing on urgent tasks
- **Due Date**: For time-sensitive workflows
- **Created Date**: To see newest items first
- **Title**: For alphabetical organization
- **Custom**: When you need specific order

### Performance Tips
- **Avoid frequent sort changes** in large columns
- **Use custom order** for frequently reordered columns
- **Consider default sorts** that match your workflow

### User Experience
- **Clear visual indicators** for current sort
- **Intuitive direction labels** (High to Low, A to Z)
- **Quick reset option** for easy recovery
- **Consistent behavior** across all columns

## Troubleshooting

### Common Issues

1. **Sort not applying**
   - Check if cards have the required fields
   - Verify sort option is valid
   - Ensure direction is correct

2. **Performance issues**
   - Reduce number of cards per column
   - Use simpler sort options
   - Check for infinite re-renders

3. **Sort not persisting**
   - Verify context state management
   - Check for state resets
   - Ensure proper component mounting

### Debug Mode
```javascript
// Enable debug logging
console.log('Current sort config:', getColumnSort(columnId));
console.log('Sorted cards:', getSortedCardsByColumn(columnId));
```

## Migration Notes

### From Basic to Sorted
- **No breaking changes** to existing code
- **Sort is opt-in** - columns work without sorting
- **Backward compatible** with existing card data
- **Gradual adoption** - implement column by column

### Data Requirements
- **Priority**: Card must have `priority` field
- **Dates**: Card must have `createdAt`, `updatedAt`, or `dueDate`
- **Title**: Card must have `title` field
- **Assignees**: Card must have `assignees` array
- **Labels**: Card must have `labels` array

The sorting system is designed to be robust and handle missing data gracefully, defaulting to the original order when required fields are not available.
