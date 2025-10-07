import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Notification socket
let notificationSocket: Socket | null = null;

// ==================== Notification Socket ====================
export const initializeSocket = (token: string) => {
  if (notificationSocket?.connected) {
    return notificationSocket;
  }

  notificationSocket = io(`${SOCKET_URL}/notifications`, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  notificationSocket.on('connect', () => {
    console.log('✅ WebSocket connected to notifications');
  });

  notificationSocket.on('disconnect', (reason) => {
    console.log('❌ WebSocket disconnected:', reason);
  });

  notificationSocket.on('connect_error', (error) => {
    console.error('WebSocket connection error:', error.message);
  });

  notificationSocket.on('reconnect', (attemptNumber) => {
    console.log(`🔄 WebSocket reconnected after ${attemptNumber} attempts`);
  });

  return notificationSocket;
};

export const getSocket = () => notificationSocket;

export const disconnectSocket = () => {
  if (notificationSocket) {
    notificationSocket.disconnect();
    notificationSocket = null;
    console.log('WebSocket disconnected manually');
  }
};

// ==================== Messaging Socket ====================

export interface SocketMessage {
  id: number;
  conversationId: number;
  senderId: number;
  receiverId: number;
  content: string;
  attachments?: any[];
  status: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  createdAt: string | Date;
  sender: {
    id: number;
    name: string;
    avatar?: string;
  };
}

export interface TypingIndicator {
  conversationId: number;
  userId: number;
  isTyping: boolean;
}

export interface UserStatus {
  userId: number;
  status: 'online' | 'offline';
  timestamp: Date;
}

class MessagingSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(token: string, userId: number): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(`${SOCKET_URL}/messaging`, {
      auth: {
        token,
        userId,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventListeners();
    return this.socket;
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Messaging socket connected:', this.socket?.id);
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Messaging socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Messaging socket connection error:', error);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.socket?.disconnect();
      }
    });

    this.socket.on('error:message', (error) => {
      console.error('Message error:', error);
    });
  }

  sendMessage(data: {
    receiverId: number;
    content: string;
    attachments?: any[];
    tempId?: string;
  }) {
    if (!this.socket?.connected) {
      throw new Error('Socket not connected');
    }
    this.socket.emit('message:send', data);
  }

  markDelivered(messageId: number) {
    if (!this.socket?.connected) return;
    this.socket.emit('message:delivered', { messageId });
  }

  markRead(messageIds: number[], conversationId: number) {
    if (!this.socket?.connected) return;
    this.socket.emit('message:read', { messageIds, conversationId });
  }

  startTyping(conversationId: number, receiverId: number) {
    if (!this.socket?.connected) return;
    this.socket.emit('typing:start', { conversationId, receiverId });
  }

  stopTyping(conversationId: number, receiverId: number) {
    if (!this.socket?.connected) return;
    this.socket.emit('typing:stop', { conversationId, receiverId });
  }

  joinConversation(conversationId: number) {
    if (!this.socket?.connected) return;
    this.socket.emit('conversation:join', { conversationId });
  }

  leaveConversation(conversationId: number) {
    if (!this.socket?.connected) return;
    this.socket.emit('conversation:leave', { conversationId });
  }

  onMessageReceive(callback: (message: SocketMessage) => void) {
    if (!this.socket) return;
    this.socket.on('message:receive', callback);
  }

  onMessageStatus(callback: (status: any) => void) {
    if (!this.socket) return;
    this.socket.on('message:status', callback);
  }

  onTypingIndicator(callback: (data: TypingIndicator) => void) {
    if (!this.socket) return;
    this.socket.on('typing:indicator', callback);
  }

  onUserStatus(callback: (status: UserStatus) => void) {
    if (!this.socket) return;
    this.socket.on('user:status', callback);
  }

  onOfflineMessages(callback: (messages: SocketMessage[]) => void) {
    if (!this.socket) return;
    this.socket.on('offline:messages', callback);
  }

  off(eventName: string) {
    if (!this.socket) return;
    this.socket.off(eventName);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export const messagingSocket = new MessagingSocketService();
