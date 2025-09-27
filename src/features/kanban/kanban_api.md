# Kanban Board API Documentation v2.0

## Overview

The Kanban Board API v2.0 provides a complete, modern backend implementation for managing Kanban boards using **Mongoose ODM** with MongoDB. The system follows a **branch-based architecture** where each branch has its own board, and all users within a branch work on the same board.

## 🚀 Key Features

- **Modern Schema Design**: Clean, normalized data structure with embedded documents
- **Mongoose ODM**: Type-safe database operations with built-in validation
- **Activity Tracking**: Complete audit trail for all operations
- **Real-time Ready**: WebSocket support for live updates
- **Search & Filtering**: Advanced search capabilities with full-text search
- **Pagination**: Efficient data loading with cursor-based pagination
- **Data Validation**: Built-in schema validation and error handling
- **Performance Optimized**: Proper indexing and query optimization

## Architecture

### Branch-Based System
- **One Board Per Branch**: Each branch has exactly one Kanban board
- **Auto-Creation**: Boards are automatically created when first accessed
- **User Scoping**: All operations are scoped to the user's branch
- **Data Isolation**: Users can only see and interact with cards in their branch

### Database Schema
- **New Collections**: All new collections use `v2_` prefix (e.g., `v2_cards`, `v2_columns`)
- **No Interference**: Existing collections remain untouched
- **Future-Proof**: Designed for scalability and extensibility

### Authentication
All endpoints require JWT authentication via the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Base URL
```
/api/board/v2
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": [...],
  "total": 100,
  "hasMore": true
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

### Pagination Response
```json
{
  "success": true,
  "data": [...],
  "total": 100,
  "hasMore": true,
  "page": {
    "limit": 50,
    "skip": 0,
    "nextSkip": 50
  }
}
```

## Data Models

### Card Model
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
  "contacts": [
    {
      "name": "string",
      "phone": "string",
      "countryCode": "string",
      "isWhatsapp": "boolean",
      "isAlternate": "boolean"
    }
  ],
  "labels": [
    {
      "text": "string",
      "color": "string"
    }
  ],
  "checklists": [
    {
      "title": "string",
      "items": [
        {
          "text": "string",
          "done": "boolean"
        }
      ]
    }
  ],
  "readyProducts": [
    {
      "title": "string",
      "products": [
        {
          "name": "string",
          "quantity": "number",
          "status": "pending | ready | shipped",
          "notes": "string"
        }
      ]
    }
  ],
  "attachments": [
    {
      "url": "string",
      "name": "string",
      "size": "number",
      "mime": "string"
    }
  ],
  "comments": [
    {
      "user": "ObjectId (ref: User)",
      "text": "string",
      "attachments": "array",
      "mentions": "array",
      "createdAt": "Date",
      "updatedAt": "Date"
    }
  ],
  "activities": [
    {
      "actor": "ObjectId (ref: User)",
      "action": "string",
      "targetId": "ObjectId",
      "payload": "object",
      "createdAt": "Date"
    }
  ],
  "isDeleted": "boolean",
  "isArchived": "boolean",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Column Model
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

### User Model
```json
{
  "_id": "ObjectId",
  "userId": "number (unique)",
  "userName": "string (required)",
  "designation": "string",
  "branchId": "ObjectId (ref: Branch)",
  "contact": "string",
  "whatsAppNumber": "string",
  "active": "boolean",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

## API Endpoints

### Board Management

#### Get Branch Board Data
```http
GET /api/board/v2/board/branch
```

**Description**: Get the complete board data for the user's branch including columns and cards.

**Response**:
```json
{
  "success": true,
  "data": {
    "branch": {
      "_id": "ObjectId",
      "branchName": "string",
      "location": "string",
      "contact": "string"
    },
    "columns": [
      {
        "_id": "ObjectId",
        "title": "string",
        "type": "string",
        "position": "number",
        "cards": [...]
      }
    ],
    "stats": {
      "totalCards": "number",
      "completedCards": "number",
      "overdueCards": "number",
      "completionRate": "number",
      "priorityBreakdown": {
        "low": "number",
        "medium": "number",
        "high": "number",
        "urgent": "number"
      }
    }
  }
}
```

#### Get Board Structure
```http
GET /api/board/v2/board
```

**Description**: Get the board structure with columns and cards for the user's branch.

**Response**: Same as above

#### Update Board Settings
```http
PATCH /api/board/v2/board/branch
```

**Description**: Update board settings for the user's branch.

**Request Body**:
```json
{
  "settings": {
    "allowPublicView": "boolean",
    "requireCardApproval": "boolean",
    "maxCardsPerColumn": "number"
  }
}
```

#### Get Board Activity
```http
GET /api/board/v2/board/branch/activity?limit=50&before=timestamp&types=card_created,card_moved
```

**Description**: Get activity feed for the branch board.

**Query Parameters**:
- `limit` (optional): Number of activities to return (default: 50, max: 200)
- `before` (optional): Timestamp to get activities before this time
- `types` (optional): Comma-separated list of activity types

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "ObjectId",
      "type": "card_created",
      "actor": {
        "_id": "ObjectId",
        "userName": "string",
        "designation": "string"
      },
      "cardId": "ObjectId",
      "description": "string",
      "createdAt": "Date"
    }
  ]
}
```

#### Get Board Members
```http
GET /api/board/v2/board/branch/members
```

**Description**: Get all active members of the branch.

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "ObjectId",
      "userName": "string",
      "designation": "string",
      "contact": "string",
      "whatsAppNumber": "string",
      "onDuty": "boolean"
    }
  ]
}
```

### Card Management

#### List Cards
```http
GET /api/board/v2/card?columnId=ObjectId&search=term&priority=high&archived=false&limit=50&skip=0&sort={"position":1}
```

**Description**: Get cards for the user's branch with filtering and pagination.

**Query Parameters**:
- `columnId` (optional): Filter by specific column
- `search` (optional): Search in title and description
- `priority` (optional): Filter by priority (low, medium, high, urgent)
- `archived` (optional): Include archived cards (default: false)
- `limit` (optional): Number of cards to return (default: 50, max: 200)
- `skip` (optional): Number of cards to skip (default: 0)
- `sort` (optional): Sort criteria as JSON string

**Response**:
```json
{
  "success": true,
  "data": [...], // Array of Card objects
  "total": 100,
  "hasMore": true
}
```

#### Get Single Card
```http
GET /api/board/v2/card/:id
```

**Description**: Get a specific card by ID.

**Response**:
```json
{
  "success": true,
  "data": {
    // Complete Card object with populated references
  }
}
```

#### Create Card
```http
POST /api/board/v2/card
```

**Description**: Create a new card in the user's branch.

**Request Body**:
```json
{
  "title": "string (required)",
  "description": "string",
  "priority": "low | medium | high | urgent",
  "dueDate": "Date",
  "columnId": "ObjectId (required)",
  "contacts": [
    {
      "name": "string",
      "phone": "string",
      "countryCode": "string",
      "isWhatsapp": "boolean",
      "isAlternate": "boolean"
    }
  ],
  "labels": [
    {
      "text": "string",
      "color": "string"
    }
  ],
  "checklists": [
    {
      "title": "string",
      "items": [
        {
          "text": "string",
          "done": "boolean"
        }
      ]
    }
  ],
  "readyProducts": [
    {
      "title": "string",
      "products": [
        {
          "name": "string",
          "quantity": "number",
          "status": "pending | ready | shipped",
          "notes": "string"
        }
      ]
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    // Complete Card object
  }
}
```

#### Update Card
```http
PUT /api/board/v2/card/:id
```

**Description**: Update an existing card.

**Request Body**: Same as create card (all fields optional)

**Response**:
```json
{
  "success": true,
  "data": {
    // Updated Card object
  }
}
```

#### Delete Card
```http
DELETE /api/board/v2/card/:id
```

**Description**: Soft delete a card (sets isDeleted to true).

**Response**:
```json
{
  "success": true,
  "message": "Card deleted successfully"
}
```

#### Move Card
```http
POST /api/board/v2/card/:id/move
```

**Description**: Move a card to a different column.

**Request Body**:
```json
{
  "toList": "ObjectId (column ID)",
  "position": "number",
  "subcolumnId": "string (optional)"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    // Updated Card object
  }
}
```

#### Archive Card
```http
POST /api/board/v2/card/:id/archive
```

**Description**: Archive a card (sets isArchived to true).

**Response**:
```json
{
  "success": true,
  "data": {
    // Updated Card object
  }
}
```

### Column Management

#### List Columns
```http
GET /api/board/v2/columns
```

**Description**: Get all columns for the user's branch.

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "ObjectId",
      "title": "string",
      "type": "string",
      "position": "number",
      "cards": [...], // Array of Card objects
      "settings": {
        "limit": "number",
        "color": "string"
      }
    }
  ]
}
```

#### Create Column
```http
POST /api/board/v2/columns
```

**Description**: Create a new column in the user's branch.

**Request Body**:
```json
{
  "title": "string (required)",
  "type": "static | dynamic",
  "settings": {
    "limit": "number",
    "color": "string"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    // Complete Column object
  }
}
```

#### Update Column
```http
PUT /api/board/v2/columns/:id
```

**Description**: Update an existing column.

**Request Body**: Same as create column (all fields optional)

**Response**:
```json
{
  "success": true,
  "data": {
    // Updated Column object
  }
}
```

#### Delete Column
```http
DELETE /api/board/v2/columns/:id
```

**Description**: Soft delete a column (sets isDeleted to true).

**Response**:
```json
{
  "success": true,
  "message": "Column deleted successfully"
}
```

#### Reorder Columns
```http
PUT /api/board/v2/columns/reorder
```

**Description**: Reorder columns in the branch.

**Request Body**:
```json
{
  "columnOrders": [
    {
      "columnId": "ObjectId",
      "position": "number"
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "message": "Columns reordered successfully"
}
```

### Comment Management

#### Get Card Comments
```http
GET /api/board/v2/comment/card/:cardId?limit=50&skip=0
```

**Description**: Get comments for a specific card.

**Query Parameters**:
- `limit` (optional): Number of comments to return (default: 50, max: 200)
- `skip` (optional): Number of comments to skip (default: 0)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "ObjectId",
      "text": "string",
      "user": {
        "_id": "ObjectId",
        "userName": "string",
        "designation": "string"
      },
      "mentions": [
        {
          "_id": "ObjectId",
          "userName": "string"
        }
      ],
      "attachments": [...],
      "createdAt": "Date",
      "updatedAt": "Date"
    }
  ],
  "total": 100,
  "hasMore": true
}
```

#### Add Comment
```http
POST /api/board/v2/comment/card/:cardId
```

**Description**: Add a comment to a card.

**Request Body**:
```json
{
  "text": "string (required)",
  "mentions": ["ObjectId (user IDs)"],
  "attachments": [
    {
      "url": "string",
      "name": "string",
      "size": "number",
      "mime": "string"
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    // Complete Comment object
  }
}
```

#### Update Comment
```http
PUT /api/board/v2/comment/:id
```

**Description**: Update an existing comment.

**Request Body**: Same as add comment (all fields optional)

**Response**:
```json
{
  "success": true,
  "data": {
    // Updated Comment object
  }
}
```

#### Delete Comment
```http
DELETE /api/board/v2/comment/:id
```

**Description**: Soft delete a comment (sets isDeleted to true).

**Response**:
```json
{
  "success": true,
  "message": "Comment deleted successfully"
}
```

### Label Management

#### List Labels
```http
GET /api/board/v2/labels
```

**Description**: Get all labels for the user's branch.

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "ObjectId",
      "text": "string",
      "color": "string",
      "usageCount": "number"
    }
  ]
}
```

#### Create Label
```http
POST /api/board/v2/labels
```

**Description**: Create a new label for the user's branch.

**Request Body**:
```json
{
  "text": "string (required)",
  "color": "string"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    // Complete Label object
  }
}
```

#### Update Label
```http
PUT /api/board/v2/labels/:id
```

**Description**: Update an existing label.

**Request Body**: Same as create label (all fields optional)

**Response**:
```json
{
  "success": true,
  "data": {
    // Updated Label object
  }
}
```

#### Delete Label
```http
DELETE /api/board/v2/labels/:id
```

**Description**: Soft delete a label (sets isDeleted to true).

**Response**:
```json
{
  "success": true,
  "message": "Label deleted successfully"
}
```

## Error Handling

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

### Error Response Format
```json
{
  "success": false,
  "message": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Specific field error details"
  }
}
```

### Common Error Codes
- `VALIDATION_ERROR` - Schema validation failed
- `NOT_FOUND` - Resource not found
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `DUPLICATE_ENTRY` - Resource already exists
- `INVALID_OPERATION` - Operation not allowed

## Rate Limiting

The API implements rate limiting to ensure fair usage:
- **Default**: 100 requests per 15 minutes per IP
- **Authentication endpoints**: 5 requests per 15 minutes per IP
- **File upload endpoints**: 10 requests per 15 minutes per IP

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## WebSocket Support (Future)

Real-time updates will be available via WebSocket connections:
```javascript
const ws = new WebSocket('ws://test.megamixsystems.com/localhost:3000/api/board/v2/ws');

ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  // Handle real-time updates
};
```

## Search & Filtering

### Full-Text Search
The API supports full-text search across card titles and descriptions:
```http
GET /api/board/v2/card?search=urgent bug fix
```

### Advanced Filtering
Multiple filters can be combined:
```http
GET /api/board/v2/card?priority=high&archived=false&search=feature
```

### Sorting
Sort by multiple fields:
```http
GET /api/board/v2/card?sort={"priority":-1,"createdAt":1}
```

## Performance Optimization

### Pagination
All list endpoints support pagination:
- Use `limit` to control page size
- Use `skip` for offset-based pagination
- Response includes `total` and `hasMore` for UI pagination

### Indexing
The database is optimized with indexes for:
- Branch-based queries
- Text search
- Date ranges
- Priority filtering
- User lookups

### Caching
Consider implementing Redis caching for:
- Frequently accessed board data
- User session information
- Search results

## Security

### Authentication
- JWT tokens with configurable expiration
- Refresh token support
- Secure token storage recommendations

### Authorization
- Branch-based access control
- User permission validation
- Resource ownership verification

### Data Validation
- Input sanitization
- Schema validation
- SQL injection prevention
- XSS protection

## Monitoring & Analytics

### Health Checks
```http
GET /api/board/v2/health
```

**Response**:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "2.0.0"
}
```

### Metrics
The API provides metrics for:
- Request count and response times
- Error rates by endpoint
- Database query performance
- User activity patterns

## Migration Guide

### From v1 to v2
1. **New Collections**: All data is stored in new `v2_` prefixed collections
2. **Schema Changes**: Updated data models with additional fields
3. **API Changes**: Some endpoints have updated request/response formats
4. **Authentication**: Same JWT-based authentication system

### Data Migration
Use the provided migration scripts to move data from v1 to v2:
```bash
node scripts/migrateToV2.js --source=v1_collections --target=v2_collections
```

## SDK & Client Libraries

### JavaScript/TypeScript
```javascript
import { KanbanAPI } from '@your-org/kanban-sdk';

const api = new KanbanAPI({
  baseURL: 'https://api.yourdomain.com',
  token: 'your-jwt-token'
});

// Get board data
const board = await api.board.getBranch();

// Create a card
const card = await api.cards.create({
  title: 'New Task',
  description: 'Task description',
  priority: 'high',
  columnId: 'column-id'
});
```

### Python
```python
from kanban_sdk import KanbanAPI

api = KanbanAPI(
    base_url='https://api.yourdomain.com',
    token='your-jwt-token'
)

# Get board data
board = api.board.get_branch()

# Create a card
card = api.cards.create(
    title='New Task',
    description='Task description',
    priority='high',
    column_id='column-id'
)
```

## Changelog

### v2.0.0 (2024-01-01)
- **BREAKING**: Migrated to Mongoose ODM
- **NEW**: Modern schema design with embedded documents
- **NEW**: Activity tracking for all operations
- **NEW**: Advanced search and filtering
- **NEW**: Comprehensive error handling
- **IMPROVED**: Performance optimization with proper indexing
- **IMPROVED**: API response consistency
- **IMPROVED**: Documentation and examples

### v1.0.0 (2023-01-01)
- Initial release with native MongoDB driver
- Basic CRUD operations
- Branch-based architecture
- JWT authentication

## Support

### Getting Help
- **Documentation**: This API documentation
- **Examples**: Check the `/examples` directory
- **Issues**: Report bugs via GitHub issues
- **Discussions**: Join our community discussions

### Contact
- **Email**: api-support@yourdomain.com
- **Slack**: #kanban-api-support
- **GitHub**: https://github.com/your-org/kanban-api

---

**Last Updated**: January 1, 2024  
**API Version**: 2.0.0  
**MongoDB Version**: 5.0+  
**Node.js Version**: 16.0+