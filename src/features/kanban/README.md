# Kanban Board System

A comprehensive, Trello-style Kanban board dashboard for non-admin users in the Megapaints application.

## 🎯 Overview

The Kanban board system provides a modern, drag-and-drop interface for managing tasks and workflows. It's designed to be the default home view for all non-admin users, offering a complete project management solution with role-based permissions, real-time updates, and extensive customization options.

## 🏗️ Architecture

### Folder Structure
```
src/features/kanban/
├── components/           # React components
│   ├── KanbanBoard.jsx   # Main board component
│   ├── KanbanColumn.jsx  # Column component
│   ├── KanbanCard.jsx    # Card component
│   ├── CardModal.jsx     # Card create/edit modal
│   ├── FiltersPanel.jsx  # Search and filter panel
│   ├── ColumnHeader.jsx  # Column header component
│   └── CreateCardButton.jsx # Add card button
├── contexts/             # React contexts
│   └── KanbanContext.jsx # Main state management
├── hooks/                # Custom React hooks
│   └── useKanban.js      # Reusable hooks
├── pages/                # Page components
│   └── KanbanDashboard.jsx # Main dashboard page
├── services/             # API and data services
│   ├── kanbanService.js  # Main service
│   └── mockData.js       # Development mock data
├── utils/                # Utilities and constants
│   ├── constants.js      # System constants
│   └── permissions.js    # Permission system
└── index.js              # Main exports
```

## 🎨 Board Layout

### Column Structure
- **Non-grouped columns**: Sales, Office
- **Grouped columns**:
  - **Production**: One column per production-designated user (with activation toggles)
  - **Ready**: For Dispatch, For Customer Collection
  - **Drivers**: One column per driver-designated user (with activation toggles)
  - **Done**: Done Today, < 7 Days, > 7 Days (with search bar in > 7 Days)

### Column Activation
- Lightweight tick-mark toggles (eye icons) for Production and Driver user subcolumns
- Deactivated columns are hidden from the board but preserved in data (no deletion)
- Toggling is permission-gated (Production/Driver Leads + Admin only)
- All activation/deactivation events are logged in activity trail
- Visual indicators show active/inactive state with opacity changes

## 🔄 Drag & Drop Rules

### Restrictions
- Cards cannot be moved **from** `< 7 Days` and `> 7 Days` columns (restricted source)
- Cards cannot be moved **to** `< 7 Days` and `> 7 Days` columns (restricted destination)
- Server-side permission checks with optimistic updates
- Automatic rollback on permission failures

### Allowed Moves
- Sales ↔ Office ↔ Production ↔ Ready ↔ Drivers ↔ Done Today
- Done Today can receive cards from any main column
- `< 7 Days` and `> 7 Days` are read-only for moves (system-managed)

## 🃏 Cards

### Core Features
- **Create**: Only in Sales column (permission-based)
- **Edit**: Modal popup with same form for create/edit
- **Fields**: Title, description, card ID, tasks, checklists, assignees, labels, due date, priority, custom fields, comments, activity log

### Card Properties
- **Attachments**: Image upload support
- **Labels**: Color-coded categorization
- **Due Dates**: Overdue/soon indicators
- **Priority**: Low, Medium, High, Urgent
- **Assignees**: Multiple user assignment
- **Comments**: Threaded discussions with @mentions
- **Activity Log**: Immutable audit trail

## 💬 Comments & Mentions

### Features
- Add/view comments per card
- @mention any user with autocomplete
- Store author, timestamp, mentions, edits/deletes
- Real-time updates

### Activity Logging
- Immutable per-card audit trail
- Logs: create, edit, move, assign, label/due changes, attachment add/remove, comment events, checklist/task updates, column activation toggles

## 🔐 Permissions System

### Role-Based Access Control (RBAC)
- **VIEW_BOARD**: All non-admin users
- **CREATE_CARD**: Sales, SalesLead, Admin (Sales column only)
- **EDIT_CARD**: Creator OR assignee OR roles (SalesLead, ProductionLead, DriverLead, Admin)
- **MOVE_CARD**: Requires EDIT_CARD + DnD rule compliance
- **ASSIGN_USERS/CHANGE_DUE/CHANGE_LABELS**: Leads + Admin
- **MANAGE_COLUMNS**: Leads of that group + Admin
- **COMMENT/MENTION**: All non-admin (configurable)

### User Roles
- Sales, SalesLead
- Production, ProductionLead
- Driver, DriverLead
- Office
- Admin

## 🎛️ Features & UX

### Search & Filters
- **> 7 Days column**: Dedicated search bar with debounced server-side search
- **Global filters panel**: URL-shareable state
- **Filter options**: Text, labels, assignees, due ranges, groups/columns
- **Search features**: Real-time results, search result count, clear functionality

### Performance
- Virtualized lists for large boards
- Background prefetch
- Incremental loading
- Optimistic updates with rollback

### Accessibility
- Keyboard drag and drop
- ARIA roles
- Focus-managed modals
- Screen reader support

## 🚀 Getting Started

### Prerequisites
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install date-fns lucide-react clsx react-hook-form react-hot-toast
```

### Usage
```jsx
import { KanbanDashboard } from './features/kanban';

// In your app
<KanbanDashboard />
```

### Development Mode
The system uses mock data in development mode. To switch to production API:

1. Update `kanbanService.js` to remove development fallbacks
2. Implement backend API endpoints
3. Configure environment variables

## 🔧 Configuration

### Constants
All system constants are centralized in `utils/constants.js`:
- Column types and configurations
- Card priorities and labels
- API endpoints
- UI constants

### Customization
- **Labels**: Add new labels in `CARD_LABELS`
- **Priorities**: Modify `CARD_PRIORITIES`
- **Columns**: Update `DEFAULT_COLUMNS`
- **Permissions**: Edit `PERMISSION_MATRIX`

## 📊 Data Flow

### State Management
- **Context**: `KanbanContext` provides global state
- **Reducer**: Handles all state updates
- **Optimistic Updates**: Immediate UI feedback
- **Error Handling**: Automatic rollback on failures

### API Integration
- **Service Layer**: `kanbanService` handles all API calls
- **Mock Data**: Development fallback
- **Error Boundaries**: Graceful error handling
- **Loading States**: User feedback during operations

## 🧪 Testing

### Component Testing
```jsx
// Test card creation
const { createCard } = useKanban();
await createCard({
  title: 'Test Card',
  description: 'Test Description',
  columnId: 'sales'
});
```

### Permission Testing
```jsx
// Test permissions
const { canCreateCard, canEditCard } = useKanban();
const canCreate = canCreateCard('sales'); // true for sales users
const canEdit = canEditCard(card, userId); // true for creator/assignee
```

## 🔮 Future Enhancements

### Planned Features
- **Power-ups**: Pluggable slots & feature flags
- **Advanced Filters**: Saved filter presets
- **Bulk Operations**: Multi-select and bulk actions
- **Real-time Collaboration**: WebSocket integration
- **Mobile Support**: Responsive design improvements
- **Export/Import**: Data portability
- **Templates**: Pre-configured board templates

### Extensibility
- **Plugin System**: Custom power-ups
- **Custom Fields**: Dynamic field definitions
- **Workflow Automation**: Rule-based actions
- **Integration APIs**: Third-party integrations

## 🐛 Troubleshooting

### Common Issues
1. **Drag & Drop not working**: Check DnD kit installation
2. **Permissions errors**: Verify user role and permissions
3. **Modal not opening**: Check modal context provider
4. **Data not loading**: Verify API endpoints and mock data

### Debug Mode
Enable debug logging:
```javascript
localStorage.setItem('kanban-debug', 'true');
```

## 📝 API Reference

### Service Methods
```javascript
// Cards
createCard(cardData)
updateCard(cardId, updates)
moveCard(cardId, fromColumn, toColumn)
deleteCard(cardId)

// Comments
addComment(cardId, commentText)
updateComment(commentId, updates)
deleteComment(commentId)

// Columns
updateColumn(columnId, updates)
toggleColumnActivation(columnId, isActive)

// Search
searchCards(columnId, searchTerm)

// Activity Logging
logActivity(activityData)
```

### Context Hooks
```javascript
// Main context
const {
  cards, columns, users,
  createCard, updateCard, moveCard,
  addComment, setFilters,
  toggleColumnActivation, searchCards,
  canCreateCard, canEditCard, canToggleColumnActivation
} = useKanban();

// Custom hooks
const { searchTerm, setSearchTerm } = useCardSearch();
const { filters, updateFilter } = useCardFilters();
const { isOpen, openModal } = useCardModal();
```

## 🤝 Contributing

### Development Guidelines
1. Follow the existing folder structure
2. Use TypeScript for new components
3. Add comprehensive tests
4. Update documentation
5. Follow the permission system
6. Implement optimistic updates

### Code Style
- Use functional components with hooks
- Implement proper error boundaries
- Follow React best practices
- Use consistent naming conventions
- Add JSDoc comments

## 📄 License

This Kanban board system is part of the Megapaints application and follows the same licensing terms.

---

**Built with ❤️ for Megapaints Team**
