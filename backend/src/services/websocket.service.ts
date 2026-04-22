/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { logger } from '../utils/logger';
import { verifyAccessToken } from '../utils/jwt';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
}

interface MealPlanUpdate {
  type: 'meal_added' | 'meal_updated' | 'meal_deleted' | 'plan_updated';
  mealPlanId: string;
  data: any;
  userId: string;
  timestamp: string;
}

export class WebSocketService {
  private io: SocketIOServer;
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds
  private mealPlanRooms: Map<string, Set<string>> = new Map(); // mealPlanId -> Set of userIds

  constructor(server: HttpServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
        credentials: true,
      },
      path: '/socket.io/',
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    
    logger.info('WebSocket service initialized');
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = verifyAccessToken(token);
        socket.userId = decoded.userId || decoded.id;
        socket.userEmail = decoded.email;
        
        logger.debug(`WebSocket authentication successful for user ${socket.userId}`);
        next();
      } catch (error) {
        logger.error('WebSocket authentication failed:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      const userId = socket.userId!;
      logger.info(`User ${userId} connected via WebSocket (${socket.id})`);

      // Track user's socket
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(socket.id);

      // Join meal plan room
      socket.on('join_meal_plan', (mealPlanId: string) => {
        socket.join(`meal_plan:${mealPlanId}`);
        
        // Track users in meal plan room
        if (!this.mealPlanRooms.has(mealPlanId)) {
          this.mealPlanRooms.set(mealPlanId, new Set());
        }
        this.mealPlanRooms.get(mealPlanId)!.add(userId);
        
        logger.debug(`User ${userId} joined meal plan room ${mealPlanId}`);
        
        // Notify others in the room
        socket.to(`meal_plan:${mealPlanId}`).emit('user_joined', {
          userId,
          userEmail: socket.userEmail,
          timestamp: new Date().toISOString(),
        });
      });

      // Leave meal plan room
      socket.on('leave_meal_plan', (mealPlanId: string) => {
        socket.leave(`meal_plan:${mealPlanId}`);
        
        const room = this.mealPlanRooms.get(mealPlanId);
        if (room) {
          room.delete(userId);
          if (room.size === 0) {
            this.mealPlanRooms.delete(mealPlanId);
          }
        }
        
        logger.debug(`User ${userId} left meal plan room ${mealPlanId}`);
        
        // Notify others in the room
        socket.to(`meal_plan:${mealPlanId}`).emit('user_left', {
          userId,
          userEmail: socket.userEmail,
          timestamp: new Date().toISOString(),
        });
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        logger.info(`User ${userId} disconnected (${socket.id})`);
        
        // Remove socket from user's set
        const userSocketSet = this.userSockets.get(userId);
        if (userSocketSet) {
          userSocketSet.delete(socket.id);
          if (userSocketSet.size === 0) {
            this.userSockets.delete(userId);
          }
        }
        
        // Clean up meal plan rooms
        this.mealPlanRooms.forEach((users, mealPlanId) => {
          if (users.has(userId)) {
            // Check if user has any other active sockets
            if (!this.userSockets.has(userId)) {
              users.delete(userId);
              if (users.size === 0) {
                this.mealPlanRooms.delete(mealPlanId);
              }
              
              // Notify others
              socket.to(`meal_plan:${mealPlanId}`).emit('user_left', {
                userId,
                userEmail: socket.userEmail,
                timestamp: new Date().toISOString(),
              });
            }
          }
        });
      });

      // Handle errors
      socket.on('error', (error) => {
        logger.error(`WebSocket error for user ${userId}:`, error);
      });
    });
  }

  /**
   * Broadcast meal plan update to all users in the room except the sender
   */
  public broadcastMealPlanUpdate(update: MealPlanUpdate, excludeUserId?: string) {
    const room = `meal_plan:${update.mealPlanId}`;
    
    // Get all sockets in the room
    const socketsInRoom = this.io.sockets.adapter.rooms.get(room);
    if (!socketsInRoom) {
      return;
    }

    // Broadcast to all sockets except those belonging to the sender
    socketsInRoom.forEach((socketId) => {
      const socket = this.io.sockets.sockets.get(socketId) as AuthenticatedSocket;
      if (socket && socket.userId !== excludeUserId) {
        socket.emit('meal_plan_update', update);
      }
    });

    logger.debug(`Broadcasted ${update.type} to meal plan ${update.mealPlanId}`);
  }

  /**
   * Get active users in a meal plan room
   */
  public getActiveUsers(mealPlanId: string): string[] {
    const users = this.mealPlanRooms.get(mealPlanId);
    return users ? Array.from(users) : [];
  }

  /**
   * Check if a user is online
   */
  public isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  /**
   * Get Socket.IO server instance
   */
  public getIO(): SocketIOServer {
    return this.io;
  }
}

let websocketService: WebSocketService | null = null;

export function initializeWebSocket(server: HttpServer): WebSocketService {
  if (!websocketService) {
    websocketService = new WebSocketService(server);
  }
  return websocketService;
}

export function getWebSocketService(): WebSocketService {
  if (!websocketService) {
    throw new Error('WebSocket service not initialized');
  }
  return websocketService;
}

// Made with Bob
