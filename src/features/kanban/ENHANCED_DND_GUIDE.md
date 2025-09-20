# Enhanced Drag and Drop Guide

## Overview
The enhanced Kanban board now includes comprehensive Trello-like drag and drop features with advanced animations, multi-select, keyboard navigation, and visual feedback.

## Features

### 🎯 Basic Drag and Drop
- **Smooth Animations**: Cards rotate and scale during drag operations
- **Visual Feedback**: Drop zones highlight when hovering over valid targets
- **Collision Detection**: Smart detection of drop targets using multiple strategies
- **Drag Preview**: Enhanced preview with card details and selection count

### ⌨️ Keyboard Navigation
- **Ctrl/Cmd + Enter**: Start keyboard drag mode
- **Arrow Keys**: Navigate between columns and subcolumns
- **Space**: Drop at current target
- **Escape**: Cancel drag operation

### 🖱️ Multi-Select
- **Ctrl/Cmd + Click**: Select multiple cards
- **Shift + Click**: Range select cards
- **Ctrl/Cmd + A**: Select all cards
- **Bulk Operations**: Move multiple cards at once

### 🎨 Visual Enhancements
- **Hover Effects**: Cards lift and scale on hover
- **Selection Indicators**: Clear visual feedback for selected cards
- **Drop Zone Indicators**: Animated drop zones with card counts
- **Drag Handles**: Grip handles appear on hover for better UX

### 🔧 Advanced Features
- **Drag Constraints**: Configurable rules for where cards can be dropped
- **Smooth Transitions**: Framer Motion animations throughout
- **Touch Support**: Works on mobile devices
- **Accessibility**: Full keyboard navigation support

## Usage

### Basic Implementation
```jsx
import { EnhancedKanbanBoard } from './features/kanban';

function App() {
  return (
    <KanbanProvider>
      <EnhancedKanbanBoard 
        onCardClick={(card) => console.log('Card clicked:', card)}
        onCreateCard={(cardData) => console.log('Create card:', cardData)}
      />
    </KanbanProvider>
  );
}
```

### Custom Drag Styles
```jsx
const customDragStyles = (isDragging, isOver) => ({
  transform: isDragging ? 'rotate(10deg) scale(1.1)' : 'scale(1)',
  boxShadow: isDragging ? '0 25px 50px rgba(0, 0, 0, 0.4)' : 'none',
  opacity: isDragging ? 0.8 : 1
});

<EnhancedKanbanCard 
  card={card}
  getDragStyles={customDragStyles}
/>
```

### Multi-Select Configuration
```jsx
const {
  selectedItems,
  isMultiDragging,
  toggleSelection,
  selectAll,
  clearSelection
} = useMultiSelectDrag();

// Select all cards
selectAll(cards);

// Toggle individual card selection
toggleSelection(cardId);
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Enter` | Start keyboard drag |
| `Arrow Keys` | Navigate between targets |
| `Space` | Drop at current target |
| `Escape` | Cancel drag |
| `Ctrl/Cmd + Click` | Multi-select |
| `Shift + Click` | Range select |
| `Ctrl/Cmd + A` | Select all |

## Drag Constraints

Configure where cards can be dropped:

```jsx
const { updateConstraints } = useDragConstraints();

updateConstraints({
  allowCrossColumn: true,
  allowCrossSubcolumn: true,
  allowReorder: true,
  maxCardsPerColumn: 50,
  restrictedColumns: ['archived'],
  allowDropOnCards: true,
  allowDropOnEmpty: true
});
```

## Animation Configuration

Customize animations and transitions:

```jsx
const { updateAnimationSettings } = useDragAnimations();

updateAnimationSettings({
  enabled: true,
  duration: 300,
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  scale: 1.08,
  rotation: 3,
  shadow: '0 15px 30px rgba(0, 0, 0, 0.2)'
});
```

## Collision Detection Strategies

Choose from multiple collision detection methods:

```jsx
const { setCollisionStrategy } = useCollisionDetection();

// Available strategies:
// - 'closestCorners' (default)
// - 'closestCenter'
// - 'rectIntersection'
// - 'pointerWithin'
// - 'custom'

setCollisionStrategy('pointerWithin');
```

## Performance Tips

1. **Use React.memo**: Wrap card components in `React.memo` for better performance
2. **Debounce Updates**: Debounce rapid state updates during drag operations
3. **Virtual Scrolling**: For large lists, consider implementing virtual scrolling
4. **Lazy Loading**: Load card details only when needed

## Browser Support

- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Troubleshooting

### Common Issues

1. **Cards not dragging smoothly**
   - Check if Framer Motion is properly installed
   - Verify CSS transforms are not being overridden

2. **Keyboard navigation not working**
   - Ensure the board container has `tabIndex={0}`
   - Check if keyboard events are being prevented

3. **Multi-select not working**
   - Verify event handlers are properly bound
   - Check if `stopPropagation()` is being called

4. **Animations stuttering**
   - Reduce animation complexity
   - Check for conflicting CSS transitions
   - Consider using `will-change` CSS property

### Debug Mode

Enable debug logging:

```jsx
// Add to your component
useEffect(() => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Drag state:', { isDragging, draggedCard, dragOver });
  }
}, [isDragging, draggedCard, dragOver]);
```

## Migration from Basic DND

To migrate from the basic KanbanBoard to EnhancedKanbanBoard:

1. Replace `KanbanBoard` with `EnhancedKanbanBoard`
2. Update card components to use `EnhancedKanbanCard`
3. Add required props for enhanced features
4. Configure animations and constraints as needed

The enhanced version is fully backward compatible with the basic implementation.
