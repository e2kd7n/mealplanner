import { io, Socket } from 'socket.io-client';
import { store } from '../store';

interface MealPlanUpdate {
  type: 'meal_added' | 'meal_updated' | 'meal_deleted';
  mealPlanId: string;
  data: any;
  userId: string;
  timestamp: string;
}

type UpdateCallback = (update: MealPlanUpdate) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private updateCallbacks: Set<UpdateCallback> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private currentMealPlanId: string | null = null;

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.socket?.connected) {
      console.log('[WebSocket] Already connected');
      return;
    }

    const token = store.getState().auth.accessToken;
    if (!token) {
      console.warn('[WebSocket] No auth token available');
      return;
    }

    const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

    console.log('[WebSocket] Connecting to', wsUrl);

    this.socket = io(wsUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: this.reconnectDelay,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventHandlers();
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      console.log('[WebSocket] Disconnecting');
      this.socket.disconnect();
      this.socket = null;
      this.currentMealPlanId = null;
      this.reconnectAttempts = 0;
    }
  }

  /**
   * Join a meal plan room
   */
  joinMealPlan(mealPlanId: string): void {
    if (!this.socket?.connected) {
      console.warn('[WebSocket] Not connected, cannot join meal plan');
      return;
    }

    // Leave current room if different
    if (this.currentMealPlanId && this.currentMealPlanId !== mealPlanId) {
      this.leaveMealPlan(this.currentMealPlanId);
    }

    console.log('[WebSocket] Joining meal plan:', mealPlanId);
    this.socket.emit('join_meal_plan', { mealPlanId });
    this.currentMealPlanId = mealPlanId;
  }

  /**
   * Leave a meal plan room
   */
  leaveMealPlan(mealPlanId: string): void {
    if (!this.socket?.connected) {
      return;
    }

    console.log('[WebSocket] Leaving meal plan:', mealPlanId);
    this.socket.emit('leave_meal_plan', { mealPlanId });
    
    if (this.currentMealPlanId === mealPlanId) {
      this.currentMealPlanId = null;
    }
  }

  /**
   * Subscribe to meal plan updates
   */
  onMealPlanUpdate(callback: UpdateCallback): () => void {
    this.updateCallbacks.add(callback);

    // Return unsubscribe function
    return () => {
      this.updateCallbacks.delete(callback);
    };
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get current meal plan ID
   */
  getCurrentMealPlanId(): string | null {
    return this.currentMealPlanId;
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[WebSocket] Connected');
      this.reconnectAttempts = 0;

      // Rejoin meal plan if we were in one
      if (this.currentMealPlanId) {
        this.joinMealPlan(this.currentMealPlanId);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error.message);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('[WebSocket] Max reconnection attempts reached');
        this.disconnect();
      }
    });

    this.socket.on('meal_plan_update', (update: MealPlanUpdate) => {
      console.log('[WebSocket] Received meal plan update:', update);
      
      // Notify all subscribers
      this.updateCallbacks.forEach((callback) => {
        try {
          callback(update);
        } catch (error) {
          console.error('[WebSocket] Error in update callback:', error);
        }
      });
    });

    this.socket.on('user_joined', (data: { userId: string; mealPlanId: string }) => {
      console.log('[WebSocket] User joined:', data);
    });

    this.socket.on('user_left', (data: { userId: string; mealPlanId: string }) => {
      console.log('[WebSocket] User left:', data);
    });

    this.socket.on('error', (error: any) => {
      console.error('[WebSocket] Error:', error);
    });
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();

// Export type for use in components
export type { MealPlanUpdate };

// Made with Bob
