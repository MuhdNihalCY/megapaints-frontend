# Kanban Board Backend Implementation Guide

## Overview
This document outlines the complete backend implementation for the Kanban board system using Node.js, Express, and MongoDB (native driver). The backend will support all the features implemented in the frontend including drag & drop, column management, permissions, and real-time updates.

## Table of Contents
1. [Project Structure](#project-structure)
2. [Database Schema](#database-schema)
3. [API Routes](#api-routes)
4. [Authentication & Authorization](#authentication--authorization)
5. [Core Features Implementation](#core-features-implementation)
6. [Real-time Features](#real-time-features)
7. [Setup Instructions](#setup-instructions)
8. [Testing](#testing)

## Project Structure

```
backend/
├── config/
│   ├── database.js
│   ├── auth.js
│   └── cors.js
├── models/
│   ├── User.js
│   ├── Board.js
│   ├── Column.js
│   ├── Card.js
│   ├── Comment.js
│   └── Activity.js
├── routes/
│   ├── auth/
│   │   ├── userAuth.js
│   │   └── adminAuth.js
│   ├── kanban/
│   │   ├── board.js
│   │   ├── cards.js
│   │   ├── columns.js
│   │   └── comments.js
│   └── users.js
├── middleware/
│   ├── auth.js
│   ├── permissions.js
│   ├── validation.js
│   └── errorHandler.js
├── services/
│   ├── kanbanService.js
│   ├── notificationService.js
│   └── activityService.js
├── utils/
│   ├── permissions.js
│   ├── validation.js
│   └── helpers.js
├── package.json
├── server.js
└── .env
```

## Database Schema

### 1. User Collection
```javascript
// models/User.js
const { ObjectId } = require('mongodb');

class User {
  static collection = 'users';

  static async create(db, userData) {
    const user = {
      _id: new ObjectId(),
      username: userData.username,
      email: userData.email,
      password: userData.password, // Hashed
      role: userData.role || 'user',
      isActive: true,
      permissions: userData.permissions || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection(this.collection).insertOne(user);
    return { ...user, _id: result.insertedId };
  }

  static async findById(db, id) {
    return await db.collection(this.collection).findOne({ _id: new ObjectId(id) });
  }

  static async findByEmail(db, email) {
    return await db.collection(this.collection).findOne({ email });
  }

  static async updateById(db, id, updateData) {
    const result = await db.collection(this.collection).updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          ...updateData, 
          updatedAt: new Date() 
        } 
      }
    );
    return result;
  }
}

module.exports = User;
```

### 2. Board Collection
```javascript
// models/Board.js
const { ObjectId } = require('mongodb');

class Board {
  static collection = 'boards';

  static async create(db, boardData) {
    const board = {
      _id: new ObjectId(),
      name: boardData.name,
      description: boardData.description,
      owner: new ObjectId(boardData.owner),
      members: boardData.members ? boardData.members.map(id => new ObjectId(id)) : [],
      isActive: true,
      settings: {
        allowPublicView: false,
        requireApproval: false,
        maxCardsPerColumn: 100
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection(this.collection).insertOne(board);
    return { ...board, _id: result.insertedId };
  }

  static async findById(db, id) {
    return await db.collection(this.collection).findOne({ _id: new ObjectId(id) });
  }

  static async findByOwner(db, ownerId) {
    return await db.collection(this.collection).find({ 
      owner: new ObjectId(ownerId) 
    }).toArray();
  }

  static async updateById(db, id, updateData) {
    const result = await db.collection(this.collection).updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          ...updateData, 
          updatedAt: new Date() 
        } 
      }
    );
    return result;
  }
}

module.exports = Board;
```

### 3. Column Collection
```javascript
// models/Column.js
const { ObjectId } = require('mongodb');

class Column {
  static collection = 'columns';

  static async create(db, columnData) {
    const column = {
      _id: new ObjectId(),
      boardId: new ObjectId(columnData.boardId),
      title: columnData.title,
      type: columnData.type,
      isGrouped: columnData.isGrouped || false,
      isActive: true,
      order: columnData.order || 0,
      subcolumns: columnData.subcolumns || [],
      permissions: {
        canCreate: columnData.permissions?.canCreate || [],
        canEdit: columnData.permissions?.canEdit || [],
        canMove: columnData.permissions?.canMove || [],
        canDelete: columnData.permissions?.canDelete || []
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection(this.collection).insertOne(column);
    return { ...column, _id: result.insertedId };
  }

  static async findByBoardId(db, boardId) {
    return await db.collection(this.collection)
      .find({ boardId: new ObjectId(boardId) })
      .sort({ order: 1 })
      .toArray();
  }

  static async findById(db, id) {
    return await db.collection(this.collection).findOne({ _id: new ObjectId(id) });
  }

  static async updateById(db, id, updateData) {
    const result = await db.collection(this.collection).updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          ...updateData, 
          updatedAt: new Date() 
        } 
      }
    );
    return result;
  }
}

module.exports = Column;
```

### 4. Card Collection
```javascript
// models/Card.js
const { ObjectId } = require('mongodb');

class Card {
  static collection = 'cards';

  static async create(db, cardData) {
    const card = {
      _id: new ObjectId(),
      boardId: new ObjectId(cardData.boardId),
      columnId: new ObjectId(cardData.columnId),
      subcolumnId: cardData.subcolumnId,
      title: cardData.title,
      description: cardData.description,
      cardId: cardData.cardId,
      priority: cardData.priority || 'medium',
      labels: cardData.labels || [],
      assignees: cardData.assignees ? cardData.assignees.map(id => new ObjectId(id)) : [],
      dueDate: cardData.dueDate ? new Date(cardData.dueDate) : null,
      attachments: cardData.attachments || [],
      tasks: cardData.tasks || [],
      checklist: cardData.checklist || [],
      customFields: cardData.customFields || [],
      order: cardData.order || 0,
      createdBy: new ObjectId(cardData.createdBy),
      updatedBy: cardData.updatedBy ? new ObjectId(cardData.updatedBy) : null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection(this.collection).insertOne(card);
    return { ...card, _id: result.insertedId };
  }

  static async findById(db, id) {
    return await db.collection(this.collection).findOne({ _id: new ObjectId(id) });
  }

  static async findByColumnId(db, columnId) {
    return await db.collection(this.collection)
      .find({ columnId: new ObjectId(columnId) })
      .sort({ order: 1 })
      .toArray();
  }

  static async findByBoardId(db, boardId) {
    return await db.collection(this.collection)
      .find({ boardId: new ObjectId(boardId) })
      .sort({ updatedAt: -1 })
      .toArray();
  }

  static async updateById(db, id, updateData) {
    const result = await db.collection(this.collection).updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          ...updateData, 
          updatedAt: new Date() 
        } 
      }
    );
    return result;
  }

  static async deleteById(db, id) {
    return await db.collection(this.collection).deleteOne({ _id: new ObjectId(id) });
  }
}

module.exports = Card;
```

### 5. Comment Collection
```javascript
// models/Comment.js
const { ObjectId } = require('mongodb');

class Comment {
  static collection = 'comments';

  static async create(db, commentData) {
    const comment = {
      _id: new ObjectId(),
      cardId: new ObjectId(commentData.cardId),
      author: new ObjectId(commentData.author),
      text: commentData.text,
      mentions: commentData.mentions ? commentData.mentions.map(id => new ObjectId(id)) : [],
      isEdited: false,
      editedAt: null,
      isDeleted: false,
      deletedAt: null,
      createdAt: new Date()
    };

    const result = await db.collection(this.collection).insertOne(comment);
    return { ...comment, _id: result.insertedId };
  }

  static async findByCardId(db, cardId) {
    return await db.collection(this.collection)
      .find({ 
        cardId: new ObjectId(cardId),
        isDeleted: false 
      })
      .sort({ createdAt: 1 })
      .toArray();
  }

  static async findById(db, id) {
    return await db.collection(this.collection).findOne({ _id: new ObjectId(id) });
  }

  static async updateById(db, id, updateData) {
    const result = await db.collection(this.collection).updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          ...updateData, 
          isEdited: true,
          editedAt: new Date() 
        } 
      }
    );
    return result;
  }
}

module.exports = Comment;
```

### 6. Activity Collection
```javascript
// models/Activity.js
const { ObjectId } = require('mongodb');

class Activity {
  static collection = 'activities';

  static async create(db, activityData) {
    const activity = {
      _id: new ObjectId(),
      boardId: new ObjectId(activityData.boardId),
      cardId: activityData.cardId ? new ObjectId(activityData.cardId) : null,
      userId: new ObjectId(activityData.userId),
      type: activityData.type,
      description: activityData.description,
      beforeData: activityData.beforeData || null,
      afterData: activityData.afterData || null,
      metadata: activityData.metadata || null,
      createdAt: new Date()
    };

    const result = await db.collection(this.collection).insertOne(activity);
    return { ...activity, _id: result.insertedId };
  }

  static async findByBoardId(db, boardId, limit = 50) {
    return await db.collection(this.collection)
      .find({ boardId: new ObjectId(boardId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
  }

  static async findByCardId(db, cardId, limit = 20) {
    return await db.collection(this.collection)
      .find({ cardId: new ObjectId(cardId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
  }
}

module.exports = Activity;
```

## API Routes

### Authentication Routes

#### User Authentication
```javascript
// routes/auth/userAuth.js
POST /auth/register
POST /auth/login
POST /auth/logout
POST /auth/refresh
GET /auth/me
```

#### Admin Authentication
```javascript
// routes/auth/adminAuth.js
POST /admin/auth/login
POST /admin/auth/logout
POST /admin/auth/refresh
GET /admin/auth/me
```

### Kanban Board Routes

#### Board Management
```javascript
// routes/kanban/board.js
GET /api/kanban/board - Get board data
POST /api/kanban/board - Create new board
PUT /api/kanban/board/:id - Update board
DELETE /api/kanban/board/:id - Delete board
GET /api/kanban/board/:id/members - Get board members
POST /api/kanban/board/:id/members - Add board member
DELETE /api/kanban/board/:id/members/:userId - Remove board member
```

#### Column Management
```javascript
// routes/kanban/columns.js
GET /api/kanban/columns - Get all columns
POST /api/kanban/columns - Create column
PUT /api/kanban/columns/:id - Update column
DELETE /api/kanban/columns/:id - Delete column
POST /api/kanban/columns/:id/toggle - Toggle column activation
PUT /api/kanban/columns/:id/reorder - Reorder columns
```

#### Card Management
```javascript
// routes/kanban/cards.js
GET /api/kanban/cards - Get all cards
POST /api/kanban/cards - Create card
GET /api/kanban/cards/:id - Get card details
PUT /api/kanban/cards/:id - Update card
DELETE /api/kanban/cards/:id - Delete card
POST /api/kanban/cards/:id/move - Move card
PUT /api/kanban/cards/:id/reorder - Reorder cards within column
POST /api/kanban/cards/:id/assign - Assign users to card
POST /api/kanban/cards/:id/attachments - Upload attachment
DELETE /api/kanban/cards/:id/attachments/:attachmentId - Remove attachment
```

#### Comment Management
```javascript
// routes/kanban/comments.js
GET /api/kanban/cards/:cardId/comments - Get card comments
POST /api/kanban/cards/:cardId/comments - Add comment
PUT /api/kanban/comments/:id - Update comment
DELETE /api/kanban/comments/:id - Delete comment
```

### User Management
```javascript
// routes/users.js
GET /api/users - Get all users
GET /api/users/:id - Get user details
POST /api/users - Create user (admin only)
PUT /api/users/:id - Update user
DELETE /api/users/:id - Delete user (admin only)
GET /api/users/search - Search users for mentions
```

## Authentication & Authorization

### JWT Implementation
```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};
```

### Permission System
```javascript
// middleware/permissions.js
const checkPermission = (permission) => {
  return (req, res, next) => {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (user.role === 'admin') {
      return next();
    }

    if (!user.permissions.includes(permission)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};
```

## Core Features Implementation

### 1. Drag & Drop Logic
```javascript
// services/kanbanService.js
const { ObjectId } = require('mongodb');
const Card = require('../models/Card');
const Activity = require('../models/Activity');

class KanbanService {
  constructor(db) {
    this.db = db;
  }

  async moveCard(cardId, fromColumn, toColumn, userId, toSubcolumn = null) {
    const session = this.db.startSession();
    
    try {
      await session.withTransaction(async () => {
        const card = await Card.findById(this.db, cardId);
        if (!card) {
          throw new Error('Card not found');
        }

        // Check permissions
        const canMove = await this.checkMovePermission(userId, fromColumn, toColumn);
        if (!canMove) {
          throw new Error('Insufficient permissions to move card');
        }

        // Check DnD restrictions
        if (DND_RESTRICTIONS.RESTRICTED_COLUMNS.includes(toColumn)) {
          throw new Error('Cannot move card to restricted column');
        }

        // Update card
        await Card.updateById(this.db, cardId, {
          columnId: new ObjectId(toColumn),
          subcolumnId: toSubcolumn,
          updatedBy: new ObjectId(userId)
        });

        // Log activity
        await Activity.create(this.db, {
          boardId: card.boardId,
          cardId: card._id,
          userId,
          type: 'CARD_MOVED',
          description: `Card moved from ${fromColumn} to ${toColumn}`,
          beforeData: { columnId: fromColumn },
          afterData: { columnId: toColumn, subcolumnId: toSubcolumn }
        });
      });

      return await Card.findById(this.db, cardId);
    } catch (error) {
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async checkMovePermission(userId, fromColumn, toColumn) {
    // Implementation for checking move permissions
    const user = await this.db.collection('users').findOne({ _id: new ObjectId(userId) });
    
    if (user.role === 'admin') return true;
    
    // Check specific permissions based on column types
    const fromCol = await this.db.collection('columns').findOne({ _id: new ObjectId(fromColumn) });
    const toCol = await this.db.collection('columns').findOne({ _id: new ObjectId(toColumn) });
    
    return user.permissions.includes('MOVE_CARD');
  }
}

module.exports = KanbanService;
```

### 2. Column Activation Toggle
```javascript
const toggleColumnActivation = async (db, columnId, isActive, userId) => {
  const column = await Column.findById(db, columnId);
  if (!column) {
    throw new Error('Column not found');
  }

  // Check permissions
  const canManage = await checkManageColumnPermission(db, userId, columnId);
  if (!canManage) {
    throw new Error('Insufficient permissions to manage column');
  }

  await Column.updateById(db, columnId, { isActive });

  // Log activity
  await Activity.create(db, {
    boardId: column.boardId,
    userId,
    type: 'COLUMN_TOGGLED',
    description: `Column ${isActive ? 'activated' : 'deactivated'}`,
    beforeData: { isActive: !isActive },
    afterData: { isActive }
  });

  return await Column.findById(db, columnId);
};
```

### 3. Comment System with Mentions
```javascript
const addComment = async (db, cardId, commentData, userId) => {
  const card = await Card.findById(db, cardId);
  if (!card) {
    throw new Error('Card not found');
  }

  // Extract mentions from comment text
  const mentions = extractMentions(commentData.text);
  
  const comment = await Comment.create(db, {
    cardId,
    author: userId,
    text: commentData.text,
    mentions
  });

  // Send notifications to mentioned users
  if (mentions.length > 0) {
    await sendMentionNotifications(db, mentions, comment, card);
  }

  // Log activity
  await Activity.create(db, {
    boardId: card.boardId,
    cardId,
    userId,
    type: 'COMMENT_ADDED',
    description: 'Comment added',
    afterData: { commentId: comment._id, mentions }
  });

  return comment;
};

const extractMentions = (text) => {
  const mentionRegex = /@(\w+)/g;
  const mentions = [];
  let match;
  
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]);
  }
  
  return mentions;
};
```

### 4. Search Implementation
```javascript
const searchCards = async (db, boardId, searchTerm, filters = {}) => {
  const query = {
    boardId: new ObjectId(boardId),
    $or: [
      { title: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } },
      { cardId: { $regex: searchTerm, $options: 'i' } }
    ]
  };

  // Apply filters
  if (filters.labels && filters.labels.length > 0) {
    query.labels = { $in: filters.labels };
  }

  if (filters.assignees && filters.assignees.length > 0) {
    query.assignees = { $in: filters.assignees.map(id => new ObjectId(id)) };
  }

  if (filters.priority) {
    query.priority = filters.priority;
  }

  if (filters.dueDate) {
    query.dueDate = { $gte: new Date(filters.dueDate) };
  }

  const cards = await db.collection('cards')
    .find(query)
    .sort({ updatedAt: -1 })
    .toArray();

  // Populate user data
  const userIds = [...new Set([
    ...cards.map(card => card.createdBy),
    ...cards.flatMap(card => card.assignees || [])
  ])];

  const users = await db.collection('users')
    .find({ _id: { $in: userIds } })
    .project({ username: 1, email: 1 })
    .toArray();

  const userMap = users.reduce((map, user) => {
    map[user._id.toString()] = user;
    return map;
  }, {});

  return cards.map(card => ({
    ...card,
    createdBy: userMap[card.createdBy.toString()],
    assignees: (card.assignees || []).map(id => userMap[id.toString()])
  }));
};
```

## Real-time Features

### WebSocket Implementation
```javascript
// services/notificationService.js
const WebSocket = require('ws');

class NotificationService {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.clients = new Map(); // userId -> WebSocket

    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });
  }

  handleConnection(ws, req) {
    // Authenticate connection
    const token = req.url.split('token=')[1];
    const user = jwt.verify(token, process.env.JWT_SECRET);
    
    this.clients.set(user.id, ws);

    ws.on('close', () => {
      this.clients.delete(user.id);
    });
  }

  broadcastToBoard(boardId, event, data) {
    this.clients.forEach((ws, userId) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ event, data }));
      }
    });
  }

  sendToUser(userId, event, data) {
    const ws = this.clients.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ event, data }));
    }
  }
}

module.exports = NotificationService;
```

### Real-time Events
```javascript
// Events to broadcast
const EVENTS = {
  CARD_CREATED: 'card:created',
  CARD_UPDATED: 'card:updated',
  CARD_MOVED: 'card:moved',
  CARD_DELETED: 'card:deleted',
  COMMENT_ADDED: 'comment:added',
  COLUMN_TOGGLED: 'column:toggled',
  USER_MENTIONED: 'user:mentioned'
};
```

## Setup Instructions

### 1. Environment Variables
```bash
# .env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/kanban_board
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5174
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
```

### 2. Package Dependencies
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "mongodb": "^5.7.0",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "express-rate-limit": "^6.10.0",
    "multer": "^1.4.5-lts.1",
    "ws": "^8.13.0",
    "joi": "^17.9.2",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.6.2",
    "supertest": "^6.3.3"
  }
}
```

### 3. Database Setup
```javascript
// config/database.js
const { MongoClient } = require('mongodb');

let db = null;

const connectDB = async () => {
  try {
    const client = new MongoClient(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    await client.connect();
    db = client.db();
    
    console.log('MongoDB connected successfully');
    
    // Create indexes for better performance
    await createIndexes();
    
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const createIndexes = async () => {
  // Users collection indexes
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  await db.collection('users').createIndex({ username: 1 }, { unique: true });
  
  // Boards collection indexes
  await db.collection('boards').createIndex({ owner: 1 });
  await db.collection('boards').createIndex({ members: 1 });
  
  // Columns collection indexes
  await db.collection('columns').createIndex({ boardId: 1 });
  await db.collection('columns').createIndex({ boardId: 1, order: 1 });
  
  // Cards collection indexes
  await db.collection('cards').createIndex({ boardId: 1 });
  await db.collection('cards').createIndex({ columnId: 1 });
  await db.collection('cards').createIndex({ columnId: 1, order: 1 });
  await db.collection('cards').createIndex({ assignees: 1 });
  await db.collection('cards').createIndex({ createdBy: 1 });
  
  // Comments collection indexes
  await db.collection('comments').createIndex({ cardId: 1 });
  await db.collection('comments').createIndex({ author: 1 });
  
  // Activities collection indexes
  await db.collection('activities').createIndex({ boardId: 1 });
  await db.collection('activities').createIndex({ cardId: 1 });
  await db.collection('activities').createIndex({ userId: 1 });
  await db.collection('activities').createIndex({ createdAt: -1 });
};

const getDB = () => {
  if (!db) {
    throw new Error('Database not connected');
  }
  return db;
};

module.exports = { connectDB, getDB };
```

### 4. Server Setup
```javascript
// server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { connectDB, getDB } = require('./config/database');
const NotificationService = require('./services/notificationService');

const app = express();
const server = require('http').createServer(app);

// Connect to database
let db;
connectDB().then(database => {
  db = database;
  
  // Make db available to routes
  app.use((req, res, next) => {
    req.db = db;
    next();
  });
});

// Initialize WebSocket service
const notificationService = new NotificationService(server);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Routes
app.use('/api/auth', require('./routes/auth/userAuth'));
app.use('/api/admin/auth', require('./routes/auth/adminAuth'));
app.use('/api/kanban', require('./routes/kanban/board'));
app.use('/api/kanban', require('./routes/kanban/columns'));
app.use('/api/kanban', require('./routes/kanban/cards'));
app.use('/api/kanban', require('./routes/kanban/comments'));
app.use('/api/users', require('./routes/users'));

// Error handling
app.use(require('./middleware/errorHandler'));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## Testing

### API Testing
```javascript
// tests/kanban.test.js
const request = require('supertest');
const app = require('../server');
const { connectDB, getDB } = require('../config/database');

describe('Kanban Board API', () => {
  let authToken;
  let testBoard;
  let testColumn;
  let testCard;
  let db;

  beforeAll(async () => {
    // Connect to test database
    db = await connectDB();
    
    // Setup test data
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ username: 'testuser', password: 'password' });
    
    authToken = loginResponse.body.token;
  });

  afterAll(async () => {
    // Clean up test data
    await db.collection('users').deleteMany({});
    await db.collection('boards').deleteMany({});
    await db.collection('columns').deleteMany({});
    await db.collection('cards').deleteMany({});
  });

  describe('Board Management', () => {
    test('should create a new board', async () => {
      const response = await request(app)
        .post('/api/kanban/board')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Board',
          description: 'Test board description'
        });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('Test Board');
      testBoard = response.body;
    });
  });

  describe('Card Management', () => {
    test('should create a new card', async () => {
      const response = await request(app)
        .post('/api/kanban/cards')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          boardId: testBoard._id,
          columnId: testColumn._id,
          title: 'Test Card',
          description: 'Test card description'
        });

      expect(response.status).toBe(201);
      expect(response.body.title).toBe('Test Card');
      testCard = response.body;
    });

    test('should move a card', async () => {
      const response = await request(app)
        .post(`/api/kanban/cards/${testCard._id}/move`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fromColumn: testColumn._id,
          toColumn: testColumn._id,
          toSubcolumn: 'production-user1'
        });

      expect(response.status).toBe(200);
    });
  });
});
```

## Security Considerations

1. **Input Validation**: Use Joi for request validation
2. **Rate Limiting**: Implement rate limiting for API endpoints
3. **CORS**: Configure CORS properly for frontend communication
4. **File Upload Security**: Validate file types and sizes
5. **NoSQL Injection**: Use parameterized queries and input validation
6. **XSS Protection**: Sanitize user inputs
7. **Authentication**: Use secure JWT tokens with proper expiration

## Performance Optimization

1. **Database Indexing**: Create indexes on frequently queried fields
2. **Pagination**: Implement pagination for large datasets
3. **Caching**: Use Redis for caching frequently accessed data
4. **Compression**: Enable gzip compression
5. **Connection Pooling**: Configure MongoDB connection pooling

## Deployment

1. **Environment**: Use PM2 or similar for process management
2. **Monitoring**: Implement logging and monitoring
3. **Backup**: Set up automated database backups
4. **SSL**: Use HTTPS in production
5. **Load Balancing**: Consider load balancing for high traffic

This comprehensive backend implementation provides all the necessary features to support the Kanban board frontend with proper authentication, authorization, real-time updates, and scalability considerations using native MongoDB operations instead of Mongoose.
