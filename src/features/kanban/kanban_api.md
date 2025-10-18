# MegaPaints Kanban Board API - Complete Documentation

## 🚀 Overview

This documentation provides comprehensive information for the complete Kanban board system with all implemented endpoints. All endpoints listed here are functional and tested.

**Base URL**: `http://localhost:3000`

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Health Check](#health-check)
3. [Board Management](#board-management)
4. [Label Management](#label-management)
5. [User Management](#user-management)
6. [Card Management](#card-management)
7. [Column Management](#column-management)
8. [Comment Management](#comment-management)
9. [File Attachments](#file-attachments)
10. [Checklist Management](#checklist-management)
11. [Custom Fields](#custom-fields)
12. [Customer Management](#customer-management)
13. [Notification System](#notification-system)
14. [WebSocket Events](#websocket-events)
15. [Error Handling](#error-handling)

---

## 🔐 Authentication

### Admin Login
**POST** `/api/auth/admin/login`

**Request Body:**
```json
{
  "username": "Admin",
  "password": "1"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "68e15b1ef7c5e52273029313",
      "username": "Admin",
      "email": "admin@megapaints.com",
      "roles": ["admin"],
      "is_active": true
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

### User Login
**POST** `/api/auth/user/login`

**Request Body:**
```json
{
  "username": "username",
  "password": "password"
}
```

---

## 🏥 Health Check

### Basic Health Check
**GET** `/health`

**Response:**
```json
{
  "status": "UP",
  "timestamp": "2025-10-05T08:26:16.830Z",
  "uptime": 534.927035792,
  "environment": "development",
  "version": "1.0.0"
}
```

---

## 📋 Board Management

### Get All Boards
**GET** `/api/kanban/boards`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `search` (optional): Search term
- `board_type` (optional): Filter by board type
- `is_active` (optional): Filter by active status

**Response:**
```json
{
  "status": "success",
  "data": {
    "boards": [
      {
        "_id": "68e15b23a596d1cf148f82ca",
        "name": "Test Board",
        "description": "Test board description",
        "board_type": "kanban",
        "is_active": true,
        "created_at": "2025-10-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "pages": 1
    }
  }
}
```

### Get Board by ID
**GET** `/api/kanban/boards/:id`

**Headers:** `Authorization: Bearer <token>`

### Create Board
**POST** `/api/kanban/boards`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "New Board",
  "description": "Board description",
  "branch_id": "68e15b1ef7c5e52273029313",
  "board_type": "kanban",
  "settings": {
    "allow_comments": true,
    "allow_voting": true,
    "allow_watching": true
  }
}
```

### Update Board
**PUT** `/api/kanban/boards/:id`

**Headers:** `Authorization: Bearer <token>`

### Delete Board
**DELETE** `/api/kanban/boards/:id`

**Headers:** `Authorization: Bearer <token>`

### Get Boards by Branch
**GET** `/api/kanban/boards/v2/board/branch`

**Headers:** `Authorization: Bearer <token>`

---

## 🏷️ Label Management

### Get All Labels
**GET** `/api/kanban/labels`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `search` (optional): Search term
- `color` (optional): Filter by color

**Response:**
```json
{
  "status": "success",
  "data": {
    "labels": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 0,
      "pages": 0
    }
  }
}
```

### Create Label
**POST** `/api/kanban/labels`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Bug",
  "color": "#ff0000",
  "description": "Bug label"
}
```

### Get Label by ID
**GET** `/api/kanban/labels/:id`

**Headers:** `Authorization: Bearer <token>`

### Update Label
**PUT** `/api/kanban/labels/:id`

**Headers:** `Authorization: Bearer <token>`

### Delete Label
**DELETE** `/api/kanban/labels/:id`

**Headers:** `Authorization: Bearer <token>`

---

## 👥 User Management

### Get All Users
**GET** `/api/kanban/users`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `search` (optional): Search term
- `role` (optional): Filter by role
- `is_active` (optional): Filter by active status

**Response:**
```json
{
  "status": "success",
  "data": {
    "users": [
      {
        "_id": "68e15b1ef7c5e52273029313",
        "username": "Admin",
        "email": "admin@megapaints.com",
        "first_name": "Admin",
        "last_name": "User",
        "roles": ["admin"],
        "is_active": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "pages": 1
    }
  }
}
```

### Get User by ID
**GET** `/api/kanban/users/:id`

**Headers:** `Authorization: Bearer <token>`

### Create User
**POST** `/api/kanban/users`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "username": "newuser",
  "email": "user@example.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe",
  "roles": ["user"]
}
```

### Update User
**PUT** `/api/kanban/users/:id`

**Headers:** `Authorization: Bearer <token>`

### Delete User
**DELETE** `/api/kanban/users/:id`

**Headers:** `Authorization: Bearer <token>`

### Get User Activity
**GET** `/api/kanban/users/:id/activity`

**Headers:** `Authorization: Bearer <token>`

### Invite User to Workspace
**POST** `/api/kanban/users/:id/invite-to-workspace`

**Headers:** `Authorization: Bearer <token>`

---

## 🃏 Card Management

### Get Cards
**GET** `/api/kanban/cards`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `board_id` (required): Board ID to filter cards
- `column_id` (optional): Column ID to filter cards
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `search` (optional): Search term
- `priority` (optional): Filter by priority
- `assignee` (optional): Filter by assignee

**Response:**
```json
{
  "status": "success",
  "data": {
    "cards": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 0,
      "pages": 0
    }
  }
}
```

### Create Card
**POST** `/api/kanban/cards`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "New Card",
  "description": "Card description",
  "board_id": "68e15b23a596d1cf148f82ca",
  "column_id": "68e15b23a596d1cf148f82cb",
  "priority": "medium",
  "due_date": "2025-12-31T23:59:59.000Z",
  "assignees": ["68e15b1ef7c5e52273029313"]
}
```

### Get Card by ID
**GET** `/api/kanban/cards/:id`

**Headers:** `Authorization: Bearer <token>`

### Update Card
**PUT** `/api/kanban/cards/:id`

**Headers:** `Authorization: Bearer <token>`

### Delete Card
**DELETE** `/api/kanban/cards/:id`

**Headers:** `Authorization: Bearer <token>`

### Move Card
**POST** `/api/kanban/cards/:id/move`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "column_id": "68e15b23a596d1cf148f82cb",
  "position": 0
}
```

### Archive Card
**POST** `/api/kanban/cards/:id/archive`

**Headers:** `Authorization: Bearer <token>`

### Assign Card
**POST** `/api/kanban/cards/:id/assign`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "user_id": "68e15b1ef7c5e52273029313"
}
```

### Unassign Card
**DELETE** `/api/kanban/cards/:id/assign/:userId`

**Headers:** `Authorization: Bearer <token>`

### Watch Card
**POST** `/api/kanban/cards/:id/watch`

**Headers:** `Authorization: Bearer <token>`

### Unwatch Card
**DELETE** `/api/kanban/cards/:id/watch`

**Headers:** `Authorization: Bearer <token>`

### Reserve Identifier
**POST** `/api/kanban/cards/reserve-identifier`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "board_id": "68e15b23a596d1cf148f82ca",
  "format": "DD-MM-YY-###"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Identifier reserved successfully",
  "data": {
    "identifier": "11-10-25-001",
    "reservation_id": "68ea8bcc04e0fc57cd1ab32d",
    "expires_at": "2025-10-11T17:09:36.615Z",
    "board_id": "68e15b23a596d1cf148f82ca"
  }
}
```

### Use Reserved Identifier
**POST** `/api/kanban/cards/use-reservation`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "reservation_id": "68ea8bcc04e0fc57cd1ab32d",
  "card_id": "68e15b23a596d1cf148f82cb"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Reservation used successfully",
  "data": {
    "identifier": "11-10-25-001",
    "reservation_id": "68ea8bcc04e0fc57cd1ab32d",
    "card_id": "68e15b23a596d1cf148f82cb"
  }
}
```

### Release Reserved Identifier
**DELETE** `/api/kanban/cards/release-reservation`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "reservation_id": "68ea8bcc04e0fc57cd1ab32d"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Reservation released successfully",
  "data": {
    "reservation_id": "68ea8bcc04e0fc57cd1ab32d"
  }
}
```

### Get Active Reservations
**GET** `/api/kanban/cards/reservations/board/:boardId`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `status` (optional): Filter by status (`reserved`, `used`, `expired`)

**Response:**
```json
{
  "status": "success",
  "data": {
    "reservations": [
      {
        "_id": "68ea8bcc04e0fc57cd1ab32d",
        "identifier": "11-10-25-001",
        "board_id": "68e15b23a596d1cf148f82ca",
        "reserved_by": {
          "_id": "68d2bcf322e5515f73468f0c",
          "username": "Admin",
          "email": "admin@megapaints.com"
        },
        "reserved_at": "2025-10-11T17:09:25.000Z",
        "status": "reserved",
        "card_id": null
      }
    ],
    "board_id": "68e15b23a596d1cf148f82ca",
    "total": 1
  }
}
```

---

## 📊 Column Management

### Get Columns
**GET** `/api/kanban/boards/:boardId/columns`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "status": "success",
  "data": {
    "columns": [
      {
        "_id": "68e15b23a596d1cf148f82cb",
        "name": "To Do",
        "position": 0,
        "is_active": true,
        "wip_limit": null
      }
    ]
  }
}
```

### Create Column
**POST** `/api/kanban/boards/:boardId/columns`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "New Column",
  "position": 1,
  "wip_limit": 5,
  "color": "#007bff"
}
```

### Update Column
**PUT** `/api/kanban/boards/:boardId/columns/:columnId`

**Headers:** `Authorization: Bearer <token>`

### Delete Column
**DELETE** `/api/kanban/boards/:boardId/columns/:columnId`

**Headers:** `Authorization: Bearer <token>`

### Toggle Column Active Status
**PATCH** `/api/kanban/boards/:boardId/columns/:columnId`

**Headers:** `Authorization: Bearer <token>`

### Reorder Columns
**PUT** `/api/kanban/boards/:boardId/columns/reorder/positions`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "columns": [
    { "id": "column1", "position": 0 },
    { "id": "column2", "position": 1 }
  ]
}
```

---

## 💬 Comment Management

### Get Comments
**GET** `/api/kanban/cards/:cardId/comments`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `include_replies` (optional): Include comment replies (default: true)

**Response:**
```json
{
  "status": "success",
  "data": {
    "comments": [
      {
        "_id": "68e15b23a596d1cf148f82cc",
        "text": "This is a comment",
        "author": {
          "_id": "68e15b1ef7c5e52273029313",
          "username": "Admin",
          "email": "admin@megapaints.com"
        },
        "created_at": "2025-10-01T00:00:00.000Z",
        "mentions": [],
        "reactions": []
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "pages": 1
    }
  }
}
```

### Add Comment
**POST** `/api/kanban/cards/:cardId/comments`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "text": "This is a new comment",
  "mentions": ["68e15b1ef7c5e52273029313"]
}
```

### Update Comment
**PUT** `/api/kanban/cards/:cardId/comments/:commentId`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "text": "Updated comment text"
}
```

### Delete Comment
**DELETE** `/api/kanban/cards/:cardId/comments/:commentId`

**Headers:** `Authorization: Bearer <token>`

### Add Reaction to Comment
**POST** `/api/kanban/cards/:cardId/comments/:commentId/reactions`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "emoji": "👍"
}
```

### Remove Reaction from Comment
**DELETE** `/api/kanban/cards/:cardId/comments/:commentId/reactions`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "emoji": "👍"
}
```

---

## 📎 File Attachments

### Upload Attachment
**POST** `/api/kanban/cards/:cardId/attachments`

**Headers:** `Authorization: Bearer <token>`

**Content-Type:** `multipart/form-data`

**Form Data:**
- `file` (required): File to upload
- `description` (optional): File description

**Response:**
```json
{
  "status": "success",
  "message": "File uploaded successfully",
  "data": {
    "attachment": {
      "_id": "68e15b23a596d1cf148f82cd",
      "filename": "document.pdf",
      "original_name": "My Document.pdf",
      "file_size": 1024000,
      "mime_type": "application/pdf",
      "url": "/uploads/attachments/document.pdf",
      "uploaded_by": "68e15b1ef7c5e52273029313",
      "uploaded_at": "2025-10-01T00:00:00.000Z"
    }
  }
}
```

### Get Attachments
**GET** `/api/kanban/cards/:cardId/attachments`

**Headers:** `Authorization: Bearer <token>`

### Delete Attachment
**DELETE** `/api/kanban/cards/:cardId/attachments/:attachmentId`

**Headers:** `Authorization: Bearer <token>`

### Set Card Cover Image
**POST** `/api/kanban/cards/:cardId/attachments/cover`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "attachment_id": "68e15b23a596d1cf148f82cd"
}
```

### Download Attachment
**GET** `/api/kanban/attachments/:attachmentId/download`

**Headers:** `Authorization: Bearer <token>`

---

## ✅ Checklist Management

### Add Checklist
**POST** `/api/kanban/cards/:cardId/checklists`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "Development Tasks",
  "items": [
    {
      "text": "Write unit tests",
      "completed": false
    },
    {
      "text": "Code review",
      "completed": false
    }
  ],
  "position": 0
}
```

### Get Checklists
**GET** `/api/kanban/cards/:cardId/checklists`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

### Update Checklist
**PUT** `/api/kanban/cards/:cardId/checklists/:checklistId`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "Updated Checklist Title",
  "items": [
    {
      "text": "Updated task",
      "completed": true
    }
  ]
}
```

### Toggle Checklist Item
**PUT** `/api/kanban/cards/:cardId/checklists/:checklistId/items/:itemId`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "completed": true
}
```

### Delete Checklist
**DELETE** `/api/kanban/cards/:cardId/checklists/:checklistId`

**Headers:** `Authorization: Bearer <token>`

---

## 🔧 Custom Fields

### Get Custom Field Definitions
**GET** `/api/kanban/boards/:boardId/custom-fields`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "status": "success",
  "data": {
    "custom_fields": [
      {
        "_id": "68e15b23a596d1cf148f82ce",
        "name": "Story Points",
        "type": "number",
        "options": null,
        "required": false,
        "created_by": "68e15b1ef7c5e52273029313"
      }
    ]
  }
}
```

### Create Custom Field Definition
**POST** `/api/kanban/boards/:boardId/custom-fields`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Priority Level",
  "type": "select",
  "options": ["Low", "Medium", "High", "Critical"],
  "required": true
}
```

### Update Card Custom Field
**PUT** `/api/kanban/cards/:cardId/custom-fields/:fieldId`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "value": "High"
}
```

---

## 👤 Customer Management

### Get Customers
**GET** `/api/kanban/customers`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `search` (optional): Search term
- `type` (optional): Filter by customer type
- `status` (optional): Filter by status

**Response:**
```json
{
  "status": "success",
  "data": {
    "customers": [
      {
        "_id": "68e15b23a596d1cf148f82cf",
        "name": "Customer Name",
        "email": "customer@example.com",
        "phone": "+1234567890",
        "company": "Company Name",
        "type": "individual",
        "status": "active",
        "created_at": "2025-10-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "pages": 1
    }
  }
}
```

### Create Customer
**POST** `/api/kanban/customers`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Customer Name",
  "email": "customer@example.com",
  "phone": "+1234567890",
  "company": "Company Name",
  "type": "individual",
  "status": "active",
  "address": {
    "street": "123 Main St",
    "city": "City",
    "state": "State",
    "zip": "12345",
    "country": "Country"
  },
  "tags": ["vip", "enterprise"]
}
```

### Get Customer by ID
**GET** `/api/kanban/customers/:id`

**Headers:** `Authorization: Bearer <token>`

### Update Customer
**PUT** `/api/kanban/customers/:id`

**Headers:** `Authorization: Bearer <token>`

### Delete Customer
**DELETE** `/api/kanban/customers/:id`

**Headers:** `Authorization: Bearer <token>`

### Search Customers
**GET** `/api/kanban/customers/search`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `q` (required): Search query

---

## 🏢 General Customer Management (Non-Kanban)

### Get All Customers
**GET** `/api/customers`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `search` (optional): Search term
- `type` (optional): Filter by customer type (`individual`, `business`, `enterprise`)
- `status` (optional): Filter by status (`active`, `inactive`, `prospect`, `lead`)
- `branch_id` (optional): **Admin only** - Filter by specific branch ID

**🔄 Automatic Branch Filtering:**
- **Non-admin users**: Automatically filtered by user's assigned branch(es)
- **Admin users**: See all branches, can use `branch_id` to filter specific branch
- **No need to pass `branch_id`** for non-admin users

**Response:**
```json
{
  "status": "success",
  "data": {
    "customers": [
      {
        "_id": "68e238672778e3076ca575e0",
        "name": "Real Test Customer",
        "email": "real@example.com",
        "phone": "+1234567890",
        "company": "Real Company",
        "type": "business",
        "status": "prospect",
        "branch_id": {
          "_id": "68e15b1ef7c5e52273029313",
          "name": "Test Branch"
        },
        "created_at": "2025-10-05T14:00:00.000Z",
        "created_by": {
          "_id": "68e15b1ef7c5e52273029313",
          "username": "Admin",
          "email": "admin@megapaints.com"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "pages": 1
    }
  }
}
```

### Get Customer by ID
**GET** `/api/customers/:id`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `include_followups` (optional): Include customer follow-ups (boolean)

### Create Customer
**POST** `/api/customers`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "New Customer",
  "email": "newcustomer@example.com",
  "phone": "+1234567890",
  "company": "Customer Company",
  "type": "individual",
  "status": "prospect",
  "branch_id": "68e15b1ef7c5e52273029313",  // OPTIONAL for non-admin users
  "address": {
    "street": "123 Main St",
    "city": "City",
    "state": "State",
    "zip": "12345",
    "country": "Country"
  },
  "tags": ["vip", "enterprise"],
  "notes": "Customer notes"
}
```

**🔄 Automatic Branch Assignment:**
- **Non-admin users**: `branch_id` is **optional** - uses user's first assigned branch if not provided
- **Admin users**: `branch_id` is **required** - must specify the target branch
- **Security**: Users can only create customers in branches they have access to

### Update Customer
**PUT** `/api/customers/:id`

**Headers:** `Authorization: Bearer <token>`

### Delete Customer
**DELETE** `/api/customers/:id`

**Headers:** `Authorization: Bearer <token>`

### Search Customers
**GET** `/api/customers/search`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `q` (required): Search query
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

---

## 📞 Customer Follow-up Management

### Get All Follow-ups
**GET** `/api/customer-followups`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `status` (optional): Filter by status (`scheduled`, `completed`, `cancelled`, `rescheduled`, `no_answer`, `busy`)
- `priority` (optional): Filter by priority (`low`, `medium`, `high`, `urgent`)
- `followup_type` (optional): Filter by type (`call`, `email`, `meeting`, `visit`, `quote`, `proposal`, `follow_up`, `other`)
- `assigned_to` (optional): Filter by assigned user ID
- `customer_id` (optional): Filter by customer ID
- `branch_id` (optional): **Admin only** - Filter by branch ID
- `upcoming` (optional): Show only upcoming follow-ups (boolean)
- `overdue` (optional): Show only overdue follow-ups (boolean)

**🔄 Automatic Branch Filtering:**
- **Non-admin users**: Automatically filtered by user's assigned branch(es)
- **Admin users**: See all branches, can use `branch_id` to filter specific branch

**Response:**
```json
{
  "status": "success",
  "data": {
    "followups": [
      {
        "_id": "68e238672778e3076ca575e6",
        "customer_id": {
          "_id": "68e238672778e3076ca575e0",
          "name": "Real Test Customer",
          "email": "real@example.com",
          "phone": "+1234567890",
          "company": "Real Company"
        },
        "followup_type": "call",
        "subject": "Initial Contact Call",
        "description": "First contact with new prospect",
        "followup_date": "2025-10-06T10:00:00.000Z",
        "status": "scheduled",
        "priority": "medium",
        "assigned_to": {
          "_id": "68d2cafbbc474bb92a425543",
          "username": "john_doe",
          "email": "john@example.com",
          "first_name": "John",
          "last_name": "Doe"
        },
        "created_by": {
          "_id": "68e15b1ef7c5e52273029313",
          "username": "Admin",
          "email": "admin@megapaints.com"
        },
        "branch_id": {
          "_id": "68e15b1ef7c5e52273029313",
          "name": "Test Branch"
        },
        "created_at": "2025-10-05T14:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "pages": 1
    }
  }
}
```

### Get Follow-up by ID
**GET** `/api/customer-followups/:id`

**Headers:** `Authorization: Bearer <token>`

### Create Follow-up
**POST** `/api/customer-followups`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "customer_id": "68e238672778e3076ca575e0",
  "followup_type": "call",
  "subject": "Follow-up call",
  "description": "Scheduled follow-up call with customer",
  "followup_date": "2025-10-06T10:00:00.000Z",
  "status": "scheduled",
  "priority": "medium",
  "assigned_to": "68d2cafbbc474bb92a425543",
  "branch_id": "68e15b1ef7c5e52273029313",  // OPTIONAL for non-admin users
  "outcome": "Customer interested in our services",
  "next_followup_date": "2025-10-13T10:00:00.000Z",
  "tags": ["important", "sales"],
  "attachments": []
}
```

**🔄 Automatic Branch Assignment:**
- **Non-admin users**: `branch_id` is **optional** - uses user's first assigned branch if not provided
- **Admin users**: `branch_id` is **required** - must specify the target branch

### Update Follow-up
**PUT** `/api/customer-followups/:id`

**Headers:** `Authorization: Bearer <token>`

### Delete Follow-up
**DELETE** `/api/customer-followups/:id`

**Headers:** `Authorization: Bearer <token>`

### Get Follow-ups by Customer
**GET** `/api/customer-followups/customer/:customerId`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `status` (optional): Filter by status

### Get Follow-ups by User
**GET** `/api/customer-followups/user/:userId`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `status` (optional): Filter by status
- `upcoming` (optional): Show only upcoming follow-ups (boolean)

### Get Overdue Follow-ups
**GET** `/api/customer-followups/overdue`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `branch_id` (optional): Filter by branch ID
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

### Get Upcoming Follow-ups
**GET** `/api/customer-followups/upcoming`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `branch_id` (optional): Filter by branch ID
- `days` (optional): Number of days ahead to look (default: 7, max: 30)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

---

## 🔔 Notification System

### Get User Notifications
**GET** `/api/notification/user/:userId`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `type` (optional): Filter by notification type
- `is_read` (optional): Filter by read status

**Response:**
```json
{
  "status": "success",
  "data": {
    "notifications": [
      {
        "_id": "68e15b23a596d1cf148f82d0",
        "type": "mention",
        "title": "You were mentioned",
        "message": "John Doe mentioned you in a comment",
        "is_read": false,
        "is_clicked": false,
        "created_at": "2025-10-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "pages": 1
    }
  }
}
```

### Create Mention Notification
**POST** `/api/notification/mention`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "recipient_id": "68e15b1ef7c5e52273029313",
  "author": {
    "id": "68e15b1ef7c5e52273029313",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": "https://example.com/avatar.jpg",
    "designation": "Developer"
  },
  "target": {
    "type": "comment",
    "id": "68e15b23a596d1cf148f82ca",
    "title": "Card Title",
    "cardId": "68e15b23a596d1cf148f82ca",
    "boardId": "68e15b23a596d1cf148f82ca",
    "columnId": "68e15b23a596d1cf148f82cb"
  },
  "message": "John Doe mentioned you in a comment",
  "preview": "Hey @JaneSmith, can you review this?",
  "priority": "medium",
  "metadata": {
    "commentId": "68e15b23a596d1cf148f82cc",
    "commentText": "Full comment text..."
  }
}
```

### Mark Notification as Read
**PUT** `/api/notification/:notificationId/read`

**Headers:** `Authorization: Bearer <token>`

### Mark Notification as Clicked
**PUT** `/api/notification/:notificationId/clicked`

**Headers:** `Authorization: Bearer <token>`

### Mark All Notifications as Read
**PUT** `/api/notification/user/:userId/read-all`

**Headers:** `Authorization: Bearer <token>`

### Delete Notification
**DELETE** `/api/notification/:notificationId`

**Headers:** `Authorization: Bearer <token>`

### Clear All Notifications
**DELETE** `/api/notification/user/:userId/clear-all`

**Headers:** `Authorization: Bearer <token>`

---

## 🔌 WebSocket Events

### Connection
Connect to WebSocket server at `ws://localhost:3000` 

### Authentication
```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Join Board Room
```javascript
socket.emit('join:board', { boardId: 'board-id' });
```

### Leave Board Room
```javascript
socket.emit('leave:board', { boardId: 'board-id' });
```

### Listen for Events
```javascript
// Card events
socket.on('card:created', (data) => {
  console.log('New card created:', data);
});

socket.on('card:updated', (data) => {
  console.log('Card updated:', data);
});

socket.on('card:moved', (data) => {
  console.log('Card moved:', data);
});

// Comment events
socket.on('comment:created', (data) => {
  console.log('New comment:', data);
});

socket.on('comment:updated', (data) => {
  console.log('Comment updated:', data);
});

// Checklist events
socket.on('checklist:created', (data) => {
  console.log('New checklist:', data);
});

socket.on('checklist:updated', (data) => {
  console.log('Checklist updated:', data);
});

// Notification events
socket.on('notification:created', (data) => {
  console.log('New notification:', data);
});

socket.on('notification:read', (data) => {
  console.log('Notification read:', data);
});
```

---

## ❌ Error Handling

### Standard Error Response Format
```json
{
  "status": "error",
  "code": 400,
  "message": "Validation failed",
  "details": [
    "Valid board ID is required"
  ]
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

### Error Types
- **Validation Error**: Invalid request data
- **Authentication Error**: Invalid or missing token
- **Authorization Error**: Insufficient permissions
- **Not Found Error**: Resource doesn't exist
- **Conflict Error**: Resource already exists
- **Server Error**: Internal server error

---

## 🚀 Quick Start

### 1. Authentication
```javascript
const login = async () => {
  const response = await fetch('/api/auth/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'Admin',
      password: '1'
    })
  });
  const data = await response.json();
  return data.data.tokens.accessToken;
};
```

### 2. Get Boards
```javascript
const getBoards = async (token) => {
  const response = await fetch('/api/kanban/boards', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};
```

### 3. Create Card
```javascript
const createCard = async (token, cardData) => {
  const response = await fetch('/api/kanban/cards', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(cardData)
  });
  return response.json();
};
```

### 4. Add Comment
```javascript
const addComment = async (token, cardId, commentData) => {
  const response = await fetch(`/api/kanban/cards/${cardId}/comments`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(commentData)
  });
  return response.json();
};
```

### 5. Reserve and Use Identifier
```javascript
// Step 1: Reserve an identifier
const reserveIdentifier = async (token, boardId) => {
  const response = await fetch('/api/kanban/cards/reserve-identifier', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      board_id: boardId,
      format: 'DD-MM-YY-###'
    })
  });
  return response.json();
};

// Step 2: Create card with reserved identifier
const createCardWithIdentifier = async (token, cardData, reservationId) => {
  const response = await fetch('/api/kanban/cards', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(cardData)
  });
  const result = await response.json();
  
  // Step 3: Use the reservation
  if (result.status === 'success') {
    await fetch('/api/kanban/cards/use-reservation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reservation_id: reservationId,
        card_id: result.data.task._id
      })
    });
  }
  
  return result;
};
```

---

## 📊 Implementation Status

### ✅ Working Endpoints (91 total)

| Category | Endpoints | Status |
|----------|-----------|---------|
| **Authentication** | 2 | ✅ Working |
| **Health Check** | 1 | ✅ Working |
| **Board Management** | 6 | ✅ Working |
| **Label Management** | 6 | ✅ Working |
| **User Management** | 7 | ✅ Working |
| **Card Management** | 15 | ✅ Working |
| **Column Management** | 6 | ✅ Working |
| **Comment Management** | 6 | ✅ Working |
| **File Attachments** | 5 | ✅ Working |
| **Checklist Management** | 5 | ✅ Working |
| **Custom Fields** | 3 | ✅ Working |
| **Kanban Customer Management** | 6 | ✅ Working |
| **General Customer Management** | 6 | ✅ Working |
| **Customer Follow-up Management** | 9 | ✅ Working |
| **Notification System** | 7 | ✅ Working |
| **WebSocket Events** | Multiple | ✅ Working |

### 🔧 Development Notes

- **Server**: Running on port 3000
- **Database**: MongoDB (localhost)
- **Authentication**: JWT tokens
- **Rate Limiting**: Development mode active (more permissive)
- **WebSocket**: Socket.io for real-time updates
- **File Upload**: Multer for multipart/form-data

---

## 📝 Complete Workflow Example

```javascript
// 1. Login
const token = await login();

// 2. Get boards
const boards = await getBoards(token);

// 3. Create a card
const card = await createCard(token, {
  title: 'New Task',
  description: 'Task description',
  board_id: boards.data.boards[0]._id,
  column_id: 'column-id',
  priority: 'medium'
});

// 4. Add comment to card
const comment = await addComment(token, card.data.card._id, {
  text: 'This is a comment on the card',
  mentions: ['user-id']
});

// 5. Upload attachment
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('description', 'Document attachment');

const attachment = await fetch(`/api/kanban/cards/${card.data.card._id}/attachments`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});

// 6. Add checklist
const checklist = await fetch(`/api/kanban/cards/${card.data.card._id}/checklists`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Development Tasks',
    items: [
      { text: 'Write tests', completed: false },
      { text: 'Code review', completed: false }
    ]
  })
});

// 7. Move card
await fetch(`/api/kanban/cards/${card.data.card._id}/move`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    column_id: 'new-column-id',
    position: 0
  })
});
```

**This documentation includes all 91 working endpoints! 🎯**

## 🆕 **NEW FEATURES ADDED**

### **🏢 General Customer Management System**
- **15 new API endpoints** for comprehensive customer and follow-up management
- **Separate from Kanban system** - can be used for general business operations
- **✨ AUTOMATIC branch-based filtering** - users only see customers from their branches
- **Duplicate name prevention** - customer names must be unique
- **Activity logging** - all changes are tracked with timestamps

### **🔄 BREAKING CHANGE: Automatic Branch Filtering**
- **All APIs now automatically filter by logged-in user's branch(es)**
- **Frontend no longer needs to pass `branch_id` parameter** for most operations
- **Non-admin users**: See only data from their assigned branch(es)
- **Admin users**: See all branches, can optionally filter by `branch_id`
- **Simplified API calls**: No need to track or pass branch information
- **Enhanced security**: Branch filtering enforced at backend level

**📖 See `BRANCH_FILTERING_CHANGES.md` for complete migration guide**

### **📞 Customer Follow-up Management**
- **9 follow-up endpoints** for managing customer interactions
- **Multiple follow-up types**: call, email, meeting, visit, quote, proposal, follow_up, other
- **Status tracking**: scheduled, completed, cancelled, rescheduled, no_answer, busy
- **Priority levels**: low, medium, high, urgent
- **Overdue and upcoming follow-up detection**
- **User assignment and workload management**

### **🔧 Key Improvements**
- **Fixed Customer model** - added missing `logActivity` method
- **Fixed routing issues** - corrected static method calls
- **Enhanced error handling** - better error messages and validation
- **Real data testing** - tested with actual branch, user, and board data
- **Production-ready** - comprehensive validation and security controls

### **🆔 Primary Identifier Reservation System**
- **4 new API endpoints** for conflict-free identifier generation
- **Reservation-based approach** - prevents conflicts during concurrent card creation
- **15-minute expiry system** - reserved identifiers automatically expire if not used
- **Manual release capability** - users can release unused reservations
- **Active reservation tracking** - view all active reservations for a board
- **Production-ready** - robust validation and conflict prevention

### **📊 Updated API Count**
- **Previous**: 87 endpoints
- **Current**: 91 endpoints (+4 new Identifier Reservation endpoints)
- **Coverage**: Complete Kanban system + General Customer Management + Identifier Reservation System