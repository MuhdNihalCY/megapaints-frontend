# Kanban API v2.0 Integration Guide

## Overview

This document outlines the integration of the Kanban frontend with the new API v2.0. The new API provides a modern, Mongoose ODM-based backend with improved data structure and enhanced features.

## Key Changes Made

### 1. Updated Kanban Service (`kanbanService.js`)

#### **New API Endpoints:**
- **Board Management:**
  - `GET /api/board/v2/board/branch` - Get complete board data for user's branch
  - `GET /api/board/v2/board` - Alternative board structure endpoint
  - `PATCH /api/board/v2/board/branch` - Update board settings

- **Card Management:**
  - `GET /api/board/v2/card` - List cards with filtering and pagination
  - `GET /api/board/v2/card/:id` - Get single card
  - `POST /api/board/v2/card` - Create new card
  - `PUT /api/board/v2/card/:id` - Update card
  - `DELETE /api/board/v2/card/:id` - Delete card
  - `POST /api/board/v2/card/:id/move` - Move card
  - `POST /api/board/v2/card/:id/archive` - Archive card

- **Column Management:**
  - `GET /api/board/v2/columns` - Get all columns for user's branch
  - `POST /api/board/v2/columns` - Create new column
  - `PUT /api/board/v2/columns/:id` - Update column
  - `DELETE /api/board/v2/columns/:id` - Delete column
  - `PUT /api/board/v2/columns/reorder` - Reorder columns

- **Comment Management:**
  - `GET /api/board/v2/comment/card/:cardId` - Get card comments
  - `POST /api/board/v2/comment/card/:cardId` - Add comment
  - `PUT /api/board/v2/comment/:id` - Update comment
  - `DELETE /api/board/v2/comment/:id` - Delete comment

- **Label Management:**
  - `GET /api/board/v2/labels` - Get all labels for user's branch
  - `POST /api/board/v2/labels` - Create new label
  - `PUT /api/board/v2/labels/:id` - Update label
  - `DELETE /api/board/v2/labels/:id` - Delete label

#### **Data Transformation:**
- **`transformCardData()`** - Updated to handle API v2.0 card structure
- **`transformCardToApi()`** - Updated to send data in API v2.0 format
- **`transformMoveData()`** - New method for card movement data

### 2. Updated Kanban Context (`KanbanContext.jsx`)

#### **Board Data Loading:**
- Updated `loadBoardData()` to work with new API v2.0 structure
- Board data now includes both cards and columns in a single response
- Improved error handling and data transformation

#### **Card Movement:**
- Updated `moveCard()` to use new API v2.0 move endpoint
- Simplified move data structure using `transformMoveData()`
- Better error handling and rollback on failure

### 3. API v2.0 Data Structure

#### **Card Model (API v2.0):**
```json
{
  "_id": "ObjectId",
  "title": "string (required, max: 200)",
  "description": "string (max: 5000)",
  "priority": "low | medium | high | urgent",
  "dueDate": "Date",
  "position": "number",
  "branchId": "ObjectId (ref: Branch)",
  "columnId": "ObjectId (ref: Column)",
  "createdBy": "ObjectId (ref: User)",
  "contacts": [...],
  "labels": [...],
  "checklists": [...],
  "readyProducts": [...],
  "attachments": [...],
  "comments": [...],
  "activities": [...],
  "isDeleted": "boolean",
  "isArchived": "boolean",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

#### **Column Model (API v2.0):**
```json
{
  "_id": "ObjectId",
  "title": "string (required, max: 50)",
  "type": "static | dynamic",
  "position": "number",
  "branchId": "ObjectId (ref: Branch)",
  "cardIds": ["ObjectId (ref: Card)"],
  "settings": {
    "limit": "number",
    "color": "string"
  },
  "isDeleted": "boolean",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### 4. Key Features of API v2.0

#### **Branch-Based System:**
- Each branch has exactly one Kanban board
- All operations are scoped to the user's branch
- Automatic board creation when first accessed

#### **Modern Schema Design:**
- Clean, normalized data structure with embedded documents
- Mongoose ODM with built-in validation
- Proper indexing for performance

#### **Enhanced Features:**
- Activity tracking for all operations
- Real-time ready (WebSocket support)
- Advanced search and filtering
- Pagination support
- Comprehensive error handling

### 5. Migration Benefits

#### **Performance:**
- Optimized database queries
- Proper indexing
- Efficient data loading

#### **Reliability:**
- Better error handling
- Data validation
- Transaction support

#### **Scalability:**
- Branch-based architecture
- Pagination support
- Caching ready

#### **Maintainability:**
- Clean API structure
- Consistent response format
- Comprehensive documentation

## Usage Examples

### Loading Board Data
```javascript
// The context automatically loads board data on initialization
const { columns, cards, loading, error } = useKanban();
```

### Creating a Card
```javascript
const newCard = await createCard({
  title: 'New Task',
  description: 'Task description',
  priority: 'high',
  columnId: 'column-id'
});
```

### Moving a Card
```javascript
await moveCard(cardId, fromColumn, toColumn, toSubcolumn, position);
```

### Getting Filtered Cards
```javascript
const filteredCards = getFilteredCards();
```

## Error Handling

The integration includes comprehensive error handling:

- **API Errors:** Properly caught and displayed to users
- **Network Errors:** Graceful fallback and retry mechanisms
- **Validation Errors:** Clear error messages for invalid data
- **Authentication Errors:** Automatic token refresh and re-authentication

## Testing

The integration has been tested with:

- ✅ Build compilation
- ✅ API endpoint compatibility
- ✅ Data transformation
- ✅ Error handling
- ✅ User authentication

## Future Enhancements

The API v2.0 integration provides a foundation for:

- Real-time updates via WebSocket
- Advanced search and filtering
- Activity feeds
- Performance monitoring
- Analytics and reporting

## Support

For issues or questions regarding the API v2.0 integration:

1. Check the API documentation in `kanban_api.md`
2. Review the service methods in `kanbanService.js`
3. Examine the context implementation in `KanbanContext.jsx`
4. Test with the development server

---

**Last Updated:** January 2024  
**API Version:** 2.0.0  
**Frontend Version:** Current
