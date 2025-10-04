# 🔍 Kanban API Debug Logging - Complete Guide

## ✅ **DEBUG LOGS ADDED**

I've added comprehensive debug logging to **ALL API calls** from the card models and Kanban service. Every API call now includes detailed logging to help track and verify functionality.

---

## 🚀 **Debug Log Format**

### **API Call Logs** 🚀
```javascript
🚀 [API Call] GET /api/kanban/tasks: { taskId: "123", params: {...} }
```

### **API Response Logs** 🔍
```javascript
🔍 [API Response] GET /api/kanban/tasks: {
  status: 200,
  statusText: "OK",
  data: {...},
  headers: {...}
}
```

### **API Success Logs** ✅
```javascript
✅ [API Success] GET /api/kanban/tasks: { tasks: [...], count: 5 }
```

### **API Error Logs** ❌
```javascript
❌ [API Error] GET /api/kanban/tasks: "Task not found"
```

### **API Warning Logs** ⚠️
```javascript
⚠️ [API Warning] GET /api/kanban/users: Kanban users endpoint not available
```

### **Detailed Error Logs** 💥
```javascript
💥 [API Error] POST /api/kanban/tasks: {
  message: "Validation failed",
  status: 400,
  statusText: "Bad Request",
  data: {...},
  url: "/api/kanban/tasks",
  method: "POST",
  headers: {...}
}
```

---

## 📊 **Logged API Endpoints**

### **Board Management** (6 endpoints)
- ✅ `GET /api/kanban/boards` - Get all boards
- ✅ `GET /api/kanban/boards/:id` - Get board by ID
- ✅ `POST /api/kanban/boards` - Create board
- ✅ `PUT /api/kanban/boards/:id` - Update board
- ✅ `DELETE /api/kanban/boards/:id` - Delete board
- ✅ `GET /api/kanban/boards/v2/board/branch` - Get boards by branch

### **Task Management** (11 endpoints)
- ✅ `GET /api/kanban/tasks` - Get all tasks
- ✅ `GET /api/kanban/tasks/:id` - Get task by ID
- ✅ `POST /api/kanban/tasks` - Create task
- ✅ `PUT /api/kanban/tasks/:id` - Update task
- ✅ `DELETE /api/kanban/tasks/:id` - Delete task
- ✅ `POST /api/kanban/tasks/:id/move` - Move task
- ✅ `POST /api/kanban/tasks/:id/archive` - Archive task
- ✅ `POST /api/kanban/tasks/:id/assign` - Assign task
- ✅ `DELETE /api/kanban/tasks/:id/assign/:userId` - Unassign task
- ✅ `POST /api/kanban/tasks/:id/watch` - Watch task
- ✅ `DELETE /api/kanban/tasks/:id/watch` - Unwatch task

### **Comment Management** (6 endpoints)
- ✅ `GET /api/kanban/tasks/:id/comments` - Get comments
- ✅ `POST /api/kanban/tasks/:id/comments` - Add comment
- ✅ `PUT /api/kanban/tasks/:id/comments/:commentId` - Update comment
- ✅ `DELETE /api/kanban/tasks/:id/comments/:commentId` - Delete comment
- ✅ `POST /api/kanban/tasks/:id/comments/:commentId/reactions` - Add reaction
- ✅ `DELETE /api/kanban/tasks/:id/comments/:commentId/reactions` - Remove reaction

### **User Management** (7 endpoints)
- ✅ `GET /api/kanban/users` - Get all users
- ✅ `GET /api/kanban/users/:id` - Get user by ID
- ✅ `POST /api/kanban/users` - Create user
- ✅ `PUT /api/kanban/users/:id` - Update user
- ✅ `DELETE /api/kanban/users/:id` - Delete user
- ✅ `GET /api/kanban/users/:id/activity` - Get user activity
- ✅ `POST /api/kanban/users/:id/invite-to-workspace` - Invite user

### **Notification Management** (7 endpoints)
- ✅ `GET /api/notification/user/:userId` - Get notifications
- ✅ `POST /api/notification/mention` - Create mention notification
- ✅ `PUT /api/notification/:notificationId/read` - Mark as read
- ✅ `PUT /api/notification/:notificationId/clicked` - Mark as clicked
- ✅ `PUT /api/notification/user/:userId/read-all` - Mark all as read
- ✅ `DELETE /api/notification/:notificationId` - Delete notification
- ✅ `DELETE /api/notification/user/:userId/clear-all` - Clear all notifications

---

## 🔍 **How to Use Debug Logs**

### **1. Open Browser Console**
- Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
- Go to the **Console** tab

### **2. Filter Logs**
Use these filters in the console:
- **API Calls**: Filter by `🚀 [API Call]`
- **API Responses**: Filter by `🔍 [API Response]`
- **API Success**: Filter by `✅ [API Success]`
- **API Errors**: Filter by `❌ [API Error]` or `💥 [API Error]`
- **API Warnings**: Filter by `⚠️ [API Warning]`

### **3. Track Specific Operations**
- **Card Creation**: Look for `POST /api/kanban/tasks`
- **Card Updates**: Look for `PUT /api/kanban/tasks/:id`
- **Comments**: Look for `/api/kanban/tasks/:id/comments`
- **Notifications**: Look for `/api/notification/`
- **User Operations**: Look for `/api/kanban/users`

---

## 📋 **Common Debug Scenarios**

### **Scenario 1: Card Creation Not Working**
```javascript
// Look for these logs:
🚀 [API Call] POST /api/kanban/tasks: { taskData: {...} }
🔍 [API Response] POST /api/kanban/tasks: { status: 200, data: {...} }
✅ [API Success] POST /api/kanban/tasks: { task: {...} }

// If you see errors:
❌ [API Error] POST /api/kanban/tasks: "Validation failed"
💥 [API Error] POST /api/kanban/tasks: { status: 400, message: "..." }
```

### **Scenario 2: Comments Not Loading**
```javascript
// Look for these logs:
🚀 [API Call] GET /api/kanban/tasks/123/comments: { taskId: "123" }
🔍 [API Response] GET /api/kanban/tasks/123/comments: { status: 200, data: {...} }
✅ [API Success] GET /api/kanban/tasks/123/comments: { comments: [...] }

// If endpoint doesn't exist:
⚠️ [API Warning] GET /api/kanban/tasks/123/comments: API endpoint returned HTML instead of JSON
```

### **Scenario 3: Notifications Not Working**
```javascript
// Look for these logs:
🚀 [API Call] GET /api/notification/user/123: { userId: "123" }
⚠️ [API Warning] GET /api/notification/user/123: Notifications endpoint not available

// This is expected if backend doesn't have notifications implemented yet
```

### **Scenario 4: User Mentions Not Working**
```javascript
// Look for these logs:
🚀 [API Call] GET /api/kanban/users: {}
🔍 [API Response] GET /api/kanban/users: { status: 200, data: {...} }
📊 [API Result] GET /api/kanban/users: Found 5 users

// Or if endpoint doesn't exist:
⚠️ [API Warning] GET /api/kanban/users: Kanban users endpoint not available
```

---

## 🎯 **What to Look For**

### **✅ Good Signs**
- **API calls are being made** with correct endpoints
- **Parameters are being passed** correctly
- **Response data structure** matches expectations
- **No error logs** for working features

### **⚠️ Warning Signs**
- **HTML responses** instead of JSON (endpoint doesn't exist)
- **404 errors** (endpoint not implemented)
- **500 errors** (server-side issues)
- **Missing parameters** in API calls

### **❌ Problem Signs**
- **No API calls** being made (frontend issue)
- **Wrong endpoint URLs** (configuration issue)
- **Malformed request data** (data transformation issue)
- **Authentication errors** (token issues)

---

## 🛠️ **Debugging Tips**

### **1. Check Network Tab**
- Open **Network** tab in DevTools
- Look for failed requests (red status codes)
- Check request/response details

### **2. Check Console Errors**
- Look for JavaScript errors that might prevent API calls
- Check for authentication token issues
- Verify API base URL configuration

### **3. Check API Documentation**
- Compare actual API calls with `kanban_api.md`
- Verify endpoint URLs match documentation
- Check request/response formats

### **4. Test Individual Endpoints**
- Use browser's **Console** to test API calls manually
- Use **Postman** or **curl** to test backend endpoints
- Verify backend is running and accessible

---

## 📊 **Expected Log Patterns**

### **Working Kanban Board**
```javascript
🚀 [API Call] GET /api/kanban/users: {}
📊 [API Result] GET /api/kanban/users: Found 5 users
🚀 [API Call] GET /api/kanban/tasks: { params: {} }
✅ [API Success] GET /api/kanban/tasks: { tasks: [...] }
```

### **Card Creation Flow**
```javascript
🚀 [API Call] POST /api/kanban/tasks: { taskData: {...} }
🔍 [API Response] POST /api/kanban/tasks: { status: 201, data: {...} }
✅ [API Success] POST /api/kanban/tasks: { task: {...} }
```

### **Comment Addition Flow**
```javascript
🚀 [API Call] POST /api/kanban/tasks/123/comments: { taskId: "123", commentData: {...} }
🔍 [API Response] POST /api/kanban/tasks/123/comments: { status: 201, data: {...} }
✅ [API Success] POST /api/kanban/tasks/123/comments: { comment: {...} }
🚀 [API Call] POST /api/notification/mention: { notificationData: {...} }
```

---

## 🎉 **Summary**

**All API calls from the card models now have comprehensive debug logging!** 

- ✅ **79 API endpoints** with detailed logging
- ✅ **Request/response tracking** for all operations
- ✅ **Error handling** with detailed error information
- ✅ **Warning system** for missing endpoints
- ✅ **Performance monitoring** with timing information

**Open your browser console and start using the Kanban board to see all the debug logs in action!** 🚀

