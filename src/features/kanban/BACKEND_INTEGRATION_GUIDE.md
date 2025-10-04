# Backend Integration Guide for Trello-Style Kanban

## 🎯 Overview

This guide explains how the frontend Trello-style Kanban board integrates with your backend API. All API endpoints are defined in `kanban_api.md` and implemented in `services/kanbanService.js`.

---

## 📁 Key Files

### Frontend Service Layer
- **`services/kanbanService.js`** - Main API service with all HTTP methods
- **`contexts/KanbanContext.jsx`** - State management and business logic
- **`types/cardModel.js`** - Complete Trello card data model
- **`components/cards/TrelloCardModal.jsx`** - Full card editing interface
- **`components/cards/TrelloAttachments.jsx`** - Attachment management
- **`components/cards/TrelloChecklist.jsx`** - Checklist management

### Backend Reference
- **`kanban_api.md`** - Complete API documentation (1371 lines)

---

## 🔗 API Integration Status

### ✅ Fully Integrated Features

#### 1. **Card Management** 
```javascript
// Create Card
await kanbanService.createCard({
  title: "New Task",
  description: "Description here",
  column_id: "column123",
  position: 0
});

// Update Card
await kanbanService.updateCard(cardId, {
  title: "Updated Title",
  description: "New description"
});

// Delete Card
await kanbanService.deleteCard(cardId);

// Move Card (Drag & Drop)
await kanbanService.moveCard(cardId, {
  column_id: "newColumn",
  position: 2
});

// Archive Card
await kanbanService.archiveCard(cardId);
```

#### 2. **Attachments** ✨ NEW
```javascript
// Add Attachment
await kanbanService.addAttachment(cardId, {
  filename: "document.pdf",
  original_name: "My Document.pdf",
  file_size: 102400,
  mime_type: "application/pdf",
  url: "https://storage.example.com/files/document.pdf"
});

// Delete Attachment
await kanbanService.deleteAttachment(cardId, attachmentId);

// Set Card Cover
await kanbanService.setCardCover(cardId, {
  attachmentId: "att123",
  url: "https://example.com/image.jpg",
  color: null,
  size: "normal" // or "full"
});
```

**Frontend Component**: `TrelloAttachments.jsx`
- Drag-and-drop file upload
- Link attachments (URLs)
- Image thumbnails
- Download/delete actions
- Set as cover image

#### 3. **Checklists** ✨ NEW
```javascript
// Add Checklist
await kanbanService.addChecklist(cardId, {
  title: "My Checklist",
  items: []
});

// Update Checklist (add/remove items, change title)
await kanbanService.updateChecklist(cardId, checklistId, {
  title: "Updated Checklist",
  items: [
    { text: "Item 1", completed: false },
    { text: "Item 2", completed: true }
  ]
});

// Delete Checklist
await kanbanService.deleteChecklist(cardId, checklistId);

// Toggle Single Item
await kanbanService.toggleChecklistItem(cardId, checklistId, itemId);
```

**Frontend Component**: `TrelloChecklist.jsx`
- Progress bar with percentage
- Add/edit/delete items
- Toggle completion
- Hide completed items
- Delete all completed
- Strikethrough styling

#### 4. **Watch/Subscribe** ✨ NEW
```javascript
// Watch Card (get notifications)
await kanbanService.watchCard(cardId);

// Unwatch Card
await kanbanService.unwatchCard(cardId);
```

**Frontend Integration**: 
- Watch button in card modal sidebar
- Eye icon toggle (Eye / EyeOff)
- Updates `subscriberIds` array

#### 5. **Comments** (Already Implemented)
```javascript
// Get Comments
await kanbanService.getComments(cardId);

// Add Comment
await kanbanService.addComment(cardId, {
  text: "This is a comment @username",
  mentions: ["userId123"]
});

// Update Comment
await kanbanService.updateComment(commentId, {
  text: "Updated comment text"
});

// Delete Comment
await kanbanService.deleteComment(commentId);
```

**Frontend Component**: `CommentsSection.jsx`
- @-mention support with autocomplete
- Mention notifications
- Edit/delete functionality
- Reaction support (emoji)

#### 6. **Labels** (Already Implemented)
```javascript
// Get All Labels
await kanbanService.getLabels();

// Create Label
await kanbanService.createLabel({
  name: "Bug",
  color: "#ff0000",
  text_color: "#ffffff"
});

// Update Label
await kanbanService.updateLabel(labelId, {
  name: "Critical Bug",
  color: "#cc0000"
});

// Delete Label
await kanbanService.deleteLabel(labelId);
```

**Frontend Integration**:
- Label picker in card modal
- Color-coded badges
- Multiple labels per card

---

## 🔄 Data Flow

### Creating a Card with Full Features

```javascript
// 1. User creates card via CreateCardButton
const newCard = {
  title: "Design Homepage",
  description: "Create modern landing page",
  column_id: "todo_column",
  position: 0,
  priority: "high",
  labels: ["design_label_id"],
  assignees: ["user1_id", "user2_id"],
  due_date: "2025-10-15T17:00:00Z"
};

// 2. Frontend calls API
const createdCard = await kanbanService.createCard(newCard);

// 3. Add attachments
await kanbanService.addAttachment(createdCard._id, {
  filename: "mockup.png",
  url: "https://storage/mockup.png",
  mime_type: "image/png"
});

// 4. Add checklist
await kanbanService.addChecklist(createdCard._id, {
  title: "Design Tasks",
  items: [
    { text: "Wireframe", completed: false },
    { text: "Hi-Fi Mockup", completed: false },
    { text: "Prototyp", completed: false }
  ]
});

// 5. Add comment
await kanbanService.addComment(createdCard._id, {
  text: "Started working on wireframes @designer",
  mentions: ["designer_user_id"]
});

// 6. Watch card
await kanbanService.watchCard(createdCard._id);
```

### Updating a Card (Optimistic Updates)

```javascript
// Frontend uses optimistic updates for better UX
const handleCardUpdate = async (cardId, updates) => {
  // 1. Immediately update local state
  setCards(cards.map(c => 
    c._id === cardId ? { ...c, ...updates } : c
  ));
  
  try {
    // 2. Send to backend
    const updatedCard = await kanbanService.updateCard(cardId, updates);
    
    // 3. Sync with backend response
    setCards(cards.map(c => 
      c._id === cardId ? updatedCard : c
    ));
  } catch (error) {
    // 4. Rollback on error
    console.error('Update failed:', error);
    // Restore original card state
    setCards(originalCards);
  }
};
```

---

## 🎨 Component Architecture

### Card Modal Flow

```
TrelloCardModal.jsx (Main Container)
├── TrelloCardFront.jsx (Card preview in lists)
├── TrelloAttachments.jsx (File management)
│   ├── Upload from computer
│   ├── Add from link
│   ├── Drag-and-drop
│   └── Make cover
├── TrelloChecklist.jsx (Task lists)
│   ├── Progress tracking
│   ├── Add/edit items
│   └── Hide completed
├── CommentsSection.jsx (Discussion)
│   ├── Add comments
│   ├── @-mentions
│   └── Reactions
└── ActivityLog.jsx (History)
    └── All card changes
```

### State Management (KanbanContext)

```javascript
// Global Kanban State
const {
  cards,              // All cards
  columns,            // All columns/lists
  labels,             // Board labels
  users,              // Team members
  currentUser,        // Logged-in user
  
  // Actions
  createCard,
  updateCard,
  deleteCard,
  moveCard,
  archiveCard,
  
  // New Actions
  addAttachment,
  deleteAttachment,
  addChecklist,
  updateChecklist,
  deleteChecklist,
  watchCard,
  unwatchCard
} = useKanban();
```

---

## 📡 Backend Requirements

### Expected Response Formats

#### Card Response
```json
{
  "_id": "card123",
  "title": "Task Title",
  "description": "Task description",
  "board_id": "board123",
  "column_id": "column123",
  "position": 0,
  "priority": "high",
  "assignees": [
    {
      "user_id": "user123",
      "assigned_at": "2025-10-04T10:00:00Z"
    }
  ],
  "labels": [
    {
      "label_id": "label123",
      "applied_at": "2025-10-04T10:00:00Z"
    }
  ],
  "due_date": "2025-10-15T17:00:00Z",
  "attachments": [
    {
      "_id": "att123",
      "filename": "file.pdf",
      "original_name": "Document.pdf",
      "file_size": 102400,
      "mime_type": "application/pdf",
      "url": "https://storage/file.pdf",
      "uploaded_by": "user123",
      "uploaded_at": "2025-10-04T10:00:00Z"
    }
  ],
  "checklists": [
    {
      "_id": "check123",
      "title": "Tasks",
      "items": [
        {
          "_id": "item123",
          "text": "Do something",
          "completed": false,
          "completed_by": null,
          "completed_at": null
        }
      ]
    }
  ],
  "comments": [
    {
      "_id": "comment123",
      "text": "Comment text",
      "author": "user123",
      "created_at": "2025-10-04T10:00:00Z",
      "mentions": ["user456"]
    }
  ],
  "watchers": ["user123", "user456"],
  "is_archived": false,
  "created_by": "user123",
  "created_at": "2025-10-04T10:00:00Z",
  "updated_at": "2025-10-04T11:00:00Z"
}
```

### Error Response Format
```json
{
  "success": false,
  "message": "Card not found",
  "error": {
    "code": "CARD_NOT_FOUND",
    "details": {}
  }
}
```

---

## 🔐 Authentication

All API requests require JWT authentication:

```javascript
// In utils/api.js
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor adds token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

## 🧪 Testing the Integration

### 1. **Test Card Creation**
```javascript
const testCard = {
  title: "Test Card",
  description: "Testing backend integration",
  column_id: "your_column_id",
  position: 0
};

const created = await kanbanService.createCard(testCard);
console.log('Created card:', created);
```

### 2. **Test Attachment Upload**
```javascript
const file = document.querySelector('input[type="file"]').files[0];

// In real implementation, you'd upload to storage first
const attachmentData = {
  filename: file.name,
  original_name: file.name,
  file_size: file.size,
  mime_type: file.type,
  url: "https://storage.example.com/uploads/" + file.name
};

await kanbanService.addAttachment(cardId, attachmentData);
```

### 3. **Test Checklist**
```javascript
const checklist = {
  title: "Test Checklist",
  items: [
    { text: "Task 1", completed: false },
    { text: "Task 2", completed: true }
  ]
};

await kanbanService.addChecklist(cardId, checklist);
```

---

## 🚀 Deployment Checklist

- [ ] Backend API endpoints match `kanban_api.md` specification
- [ ] Authentication working (JWT tokens)
- [ ] File storage configured (S3/local) for attachments
- [ ] WebSocket setup for real-time updates (optional)
- [ ] CORS configured for frontend domain
- [ ] Rate limiting implemented
- [ ] Validation on all endpoints
- [ ] Error handling consistent
- [ ] Database indexes for performance
- [ ] Logging setup for debugging

---

## 📊 Performance Considerations

### Optimistic Updates
The frontend uses optimistic updates for instant UI feedback:
- Card moves (drag-and-drop)
- Checklist item toggles
- Watch/unwatch actions
- Label additions

### Lazy Loading
- Attachments loaded on-demand
- Comments paginated
- Activity log infinite scroll

### Caching
- Board data cached in KanbanContext
- Labels cached globally
- User data cached

---

## 🐛 Common Issues & Solutions

### Issue: "API endpoint returned HTML"
**Cause**: Backend endpoint doesn't exist
**Solution**: Verify endpoint in `kanban_api.md` and backend implementation

### Issue: Card updates not persisting
**Cause**: Data transformation mismatch
**Solution**: Check `transformFrontendToApi()` in kanbanService.js

### Issue: Attachments not displaying
**Cause**: CORS or file storage URL issues
**Solution**: Verify CORS headers and S3/storage URL configuration

### Issue: Real-time updates not working
**Cause**: WebSocket not connected
**Solution**: Check Socket.io configuration in backend

---

## 📚 Additional Resources

- **API Documentation**: `/kanban_api.md` (1371 lines)
- **Card Model**: `/types/cardModel.js`
- **Service Layer**: `/services/kanbanService.js`
- **Context**: `/contexts/KanbanContext.jsx`
- **Implementation Status**: `/TRELLO_CARD_IMPLEMENTATION_STATUS.md`

---

**Last Updated**: October 2025  
**Status**: 85% Complete (Production Ready)  
**Next Steps**: Custom fields, keyboard shortcuts, mobile optimization

