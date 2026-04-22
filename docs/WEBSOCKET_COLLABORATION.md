# Real-Time Collaboration with WebSockets

## Overview

This document describes the real-time collaboration feature implemented using WebSockets for the Meal Planner application. This feature enables multiple users to see live updates when meal plans are modified, creating a collaborative planning experience.

## Architecture

### Technology Stack

- **Backend**: Socket.IO (v4.8.3) - WebSocket server with fallback to polling
- **Frontend**: socket.io-client (v4.8.3) - WebSocket client library
- **Authentication**: JWT token-based authentication for WebSocket connections
- **Transport**: WebSocket with automatic fallback to HTTP long-polling

### Components

#### Backend Components

1. **WebSocket Service** (`backend/src/services/websocket.service.ts`)
   - Manages Socket.IO server instance
   - Handles authentication middleware
   - Manages room-based channels for meal plans
   - Tracks active users and their connections
   - Broadcasts updates to relevant users

2. **Meal Plan Controller** (`backend/src/controllers/mealPlan.controller.ts`)
   - Broadcasts updates after meal operations:
     - `addMealToPlan`: Broadcasts 'meal_added' event
     - `updateMeal`: Broadcasts 'meal_updated' event
     - `removeMealFromPlan`: Broadcasts 'meal_deleted' event
     - `batchCookMeal`: Broadcasts 'meal_added' for each created meal

#### Frontend Components

1. **WebSocket Service** (`frontend/src/services/websocket.service.ts`)
   - Singleton service managing WebSocket connection
   - Handles connection lifecycle (connect/disconnect/reconnect)
   - Manages meal plan room subscriptions
   - Provides callback-based update notifications

2. **MealPlanner Component** (`frontend/src/pages/MealPlanner.tsx`)
   - Connects to WebSocket on mount
   - Subscribes to meal plan updates
   - Updates local state when receiving real-time updates
   - Joins/leaves meal plan rooms automatically

## Features

### 1. Authenticated Connections

All WebSocket connections require JWT authentication:

```typescript
// Backend authentication middleware
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  const decoded = verifyAccessToken(token);
  socket.userId = decoded.userId;
  next();
});
```

### 2. Room-Based Channels

Users join meal plan-specific rooms to receive targeted updates:

```typescript
// Join a meal plan room
socket.emit('join_meal_plan', { mealPlanId: 'plan-123' });

// Leave a meal plan room
socket.emit('leave_meal_plan', { mealPlanId: 'plan-123' });
```

### 3. Real-Time Updates

Three types of updates are broadcast:

#### Meal Added
```typescript
{
  type: 'meal_added',
  mealPlanId: 'plan-123',
  data: {
    id: 'meal-456',
    recipeId: 'recipe-789',
    mealType: 'DINNER',
    date: '2026-04-22',
    servings: 4,
    // ... other meal properties
  },
  userId: 'user-who-made-change',
  timestamp: '2026-04-22T16:48:51.000Z'
}
```

#### Meal Updated
```typescript
{
  type: 'meal_updated',
  mealPlanId: 'plan-123',
  data: {
    id: 'meal-456',
    mealType: 'LUNCH', // changed
    servings: 6, // changed
    // ... updated properties
  },
  userId: 'user-who-made-change',
  timestamp: '2026-04-22T16:48:51.000Z'
}
```

#### Meal Deleted
```typescript
{
  type: 'meal_deleted',
  mealPlanId: 'plan-123',
  data: {
    mealId: 'meal-456'
  },
  userId: 'user-who-made-change',
  timestamp: '2026-04-22T16:48:51.000Z'
}
```

### 4. Automatic Reconnection

The client automatically reconnects if the connection is lost:

```typescript
reconnection: true,
reconnectionDelay: 1000,
reconnectionAttempts: 5
```

### 5. User Presence Tracking

The backend tracks which users are connected and in which meal plan rooms:

```typescript
private userSockets: Map<string, Set<string>> = new Map();
private mealPlanRooms: Map<string, Set<string>> = new Map();
```

## Usage

### Backend Usage

The WebSocket service is automatically initialized when the server starts:

```typescript
// backend/src/index.ts
import { initializeWebSocket } from './services/websocket.service';

const server = app.listen(PORT);
initializeWebSocket(server);
```

Broadcasting updates from controllers:

```typescript
import { getWebSocketService } from '../services/websocket.service';

// After creating/updating/deleting a meal
const wsService = getWebSocketService();
wsService.broadcastMealPlanUpdate({
  type: 'meal_added',
  mealPlanId: planId,
  data: meal,
  userId,
  timestamp: new Date().toISOString(),
}, userId); // Exclude the user who made the change
```

### Frontend Usage

The WebSocket service is automatically connected in the MealPlanner component:

```typescript
import { websocketService } from '../services/websocket.service';

useEffect(() => {
  // Connect on mount
  websocketService.connect();
  
  // Subscribe to updates
  const unsubscribe = websocketService.onMealPlanUpdate((update) => {
    // Handle update
    if (update.type === 'meal_added') {
      setMeals(prev => [...prev, update.data]);
    }
  });
  
  // Cleanup on unmount
  return () => {
    unsubscribe();
    websocketService.disconnect();
  };
}, []);

// Join meal plan room
useEffect(() => {
  if (mealPlanId) {
    websocketService.joinMealPlan(mealPlanId);
  }
  return () => {
    if (mealPlanId) {
      websocketService.leaveMealPlan(mealPlanId);
    }
  };
}, [mealPlanId]);
```

## Configuration

### Environment Variables

**Backend** (`.env`):
```bash
# WebSocket server runs on the same port as HTTP server
PORT=3000
```

**Frontend** (`.env`):
```bash
# WebSocket URL (defaults to http://localhost:3000)
VITE_WS_URL=http://localhost:3000
```

### CORS Configuration

The backend CORS configuration allows WebSocket connections:

```typescript
const corsOptions = {
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true,
};
```

## Security Considerations

1. **JWT Authentication**: All WebSocket connections require valid JWT tokens
2. **User Isolation**: Users only receive updates for meal plans they have access to
3. **Room-Based Access**: Users must explicitly join meal plan rooms
4. **Token Expiration**: Expired tokens are rejected at connection time
5. **Error Handling**: Authentication errors are logged but don't crash the server

## Performance Considerations

1. **Selective Broadcasting**: Updates are only sent to users in the relevant meal plan room
2. **Exclude Originator**: The user who made the change doesn't receive their own update
3. **Efficient State Updates**: Frontend uses React state updates to minimize re-renders
4. **Connection Pooling**: Socket.IO manages connection pooling automatically
5. **Automatic Cleanup**: Disconnected users are automatically removed from rooms

## Testing

### Manual Testing

1. **Single User Test**:
   - Open the meal planner
   - Add/edit/delete a meal
   - Verify no errors in console

2. **Multi-User Test**:
   - Open the meal planner in two browser windows (or incognito)
   - Log in as the same user in both windows
   - Navigate to the same week in both windows
   - Add a meal in one window
   - Verify it appears in the other window immediately

3. **Reconnection Test**:
   - Open the meal planner
   - Stop the backend server
   - Verify connection error in console
   - Restart the backend server
   - Verify automatic reconnection

### Automated Testing

Future work: Add E2E tests using Playwright to verify real-time updates.

## Troubleshooting

### Connection Issues

**Problem**: WebSocket connection fails
**Solution**: 
- Check that backend server is running
- Verify JWT token is valid
- Check CORS configuration
- Review browser console for errors

**Problem**: Updates not received
**Solution**:
- Verify user is in the correct meal plan room
- Check that meal plan ID matches
- Review backend logs for broadcast errors

### Performance Issues

**Problem**: Slow updates
**Solution**:
- Check network latency
- Verify WebSocket transport (not falling back to polling)
- Review server load

## Future Enhancements

1. **User Presence Indicators**: Show which users are currently viewing the meal plan
2. **Typing Indicators**: Show when another user is editing a meal
3. **Conflict Resolution**: Handle simultaneous edits to the same meal
4. **Offline Support**: Queue updates when offline and sync when reconnected
5. **Push Notifications**: Notify users of changes even when not viewing the page
6. **Activity Feed**: Show a log of recent changes to the meal plan
7. **Collaborative Editing**: Allow multiple users to edit the same meal simultaneously

## Related Issues

- GitHub Issue #112: Real-Time Collaboration with WebSockets

## Implementation Date

April 22, 2026

## Contributors

- Bob (AI Assistant)
- e2kd7n (Project Owner)