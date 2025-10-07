import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { RedisService } from '../redis/redis.service';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { WsThrottleGuard } from './guards/ws-throttle.guard';

/**
 * Socket.IO Event Naming Conventions:
 *
 * Client -> Server:
 * - message:send        : Send a new message
 * - message:read        : Mark message(s) as read
 * - message:delivered   : Acknowledge message delivery
 * - typing:start        : User started typing
 * - typing:stop         : User stopped typing
 * - conversation:join   : Join a conversation room
 * - conversation:leave  : Leave a conversation room
 *
 * Server -> Client:
 * - message:receive     : Receive a new message
 * - message:status      : Message status update (sent/delivered/read)
 * - typing:indicator    : Someone is typing
 * - conversation:update : Conversation metadata update
 * - error:message       : Error occurred
 * - offline:messages    : Deliver queued offline messages
 */

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/messaging',
})
export class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MessagingGateway.name);

  constructor(
    private readonly messagingService: MessagingService,
    private readonly redisService: RedisService,
  ) {
    // Subscribe to Redis pub/sub for horizontal scaling
    this.subscribeToRedisChannels();
  }

  // ==================== Connection Management ====================

  async handleConnection(client: Socket) {
    try {
      const userId = client.handshake.auth.userId;
      if (!userId) {
        client.disconnect();
        return;
      }

      this.logger.log(`Client connected: ${client.id}, User: ${userId}`);

      // Store user online status in Redis
      await this.redisService.setUserOnline(userId, client.id);
      await this.redisService.updateLastSeen(userId);

      // Deliver offline messages
      await this.deliverOfflineMessages(client, userId);

      // Notify user's contacts that they're online
      await this.broadcastUserStatus(userId, 'online');
    } catch (error) {
      this.logger.error('Connection error:', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    try {
      const userId = client.handshake.auth.userId;
      if (userId) {
        this.logger.log(`Client disconnected: ${client.id}, User: ${userId}`);

        await this.redisService.setUserOffline(userId);
        await this.redisService.updateLastSeen(userId);

        // Notify user's contacts that they're offline
        await this.broadcastUserStatus(userId, 'offline');
      }
    } catch (error) {
      this.logger.error('Disconnect error:', error);
    }
  }

  // ==================== Message Events ====================

  @UseGuards(WsJwtGuard, WsThrottleGuard)
  @SubscribeMessage('message:send')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: {
      receiverId: number;
      content: string;
      attachments?: any[];
    },
  ) {
    try {
      const senderId = client.handshake.auth.userId;

      // Validate follow relationship
      const canMessage = await this.messagingService.canUsersMessage(senderId, payload.receiverId);
      if (!canMessage) {
        client.emit('error:message', {
          code: 'FORBIDDEN',
          message: 'You can only message users who follow you back.',
        });
        return;
      }

      // Create message
      const message = await this.messagingService.sendMessage({
        senderId,
        receiverId: payload.receiverId,
        content: payload.content,
        attachments: payload.attachments,
      });

      // Publish to Redis for horizontal scaling
      await this.redisService.publishMessage('message:new', {
        ...message,
        senderId,
        receiverId: payload.receiverId,
      });

      // Send confirmation to sender
      client.emit('message:status', {
        tempId: payload['tempId'], // Client-generated temp ID
        messageId: message.id,
        status: 'sent',
        timestamp: message.createdAt,
      });

      // Deliver to receiver if online
      await this.deliverMessage(payload.receiverId, message);

      // Queue for offline delivery if receiver is offline
      const isReceiverOnline = await this.redisService.isUserOnline(payload.receiverId);
      if (!isReceiverOnline) {
        await this.redisService.queueOfflineMessage(payload.receiverId, message);
      }
    } catch (error) {
      this.logger.error('Send message error:', error);
      client.emit('error:message', {
        code: 'INTERNAL_ERROR',
        message: 'Failed to send message.',
      });
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('message:delivered')
  async handleMessageDelivered(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { messageId: number },
  ) {
    try {
      const userId = client.handshake.auth.userId;

      await this.messagingService.markMessageDelivered(payload.messageId, userId);

      // Notify sender
      const message = await this.messagingService.getMessageById(payload.messageId);
      if (message) {
        const senderSocketId = await this.redisService.getUserSocketId(message.senderId);
        if (senderSocketId) {
          this.server.to(senderSocketId).emit('message:status', {
            messageId: payload.messageId,
            status: 'delivered',
            timestamp: new Date(),
          });
        }
      }
    } catch (error) {
      this.logger.error('Message delivered error:', error);
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('message:read')
  async handleMessageRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { messageIds: number[]; conversationId: number },
  ) {
    try {
      const userId = client.handshake.auth.userId;

      await this.messagingService.markMessagesAsRead(payload.messageIds, userId);

      // Reset unread count
      await this.redisService.resetUnreadCount(userId, payload.conversationId);

      // Notify sender(s)
      const messages = await this.messagingService.getMessagesByIds(payload.messageIds);
      const senderIds = [...new Set(messages.map(m => m.senderId))];

      for (const senderId of senderIds) {
        const senderSocketId = await this.redisService.getUserSocketId(senderId);
        if (senderSocketId) {
          this.server.to(senderSocketId).emit('message:status', {
            messageIds: payload.messageIds,
            status: 'read',
            timestamp: new Date(),
            readBy: userId,
          });
        }
      }
    } catch (error) {
      this.logger.error('Message read error:', error);
    }
  }

  // ==================== Typing Indicators ====================

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('typing:start')
  async handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: number; receiverId: number },
  ) {
    try {
      const userId = client.handshake.auth.userId;

      await this.redisService.setTypingIndicator(payload.conversationId, userId);

      // Notify receiver
      const receiverSocketId = await this.redisService.getUserSocketId(payload.receiverId);
      if (receiverSocketId) {
        this.server.to(receiverSocketId).emit('typing:indicator', {
          conversationId: payload.conversationId,
          userId,
          isTyping: true,
        });
      }
    } catch (error) {
      this.logger.error('Typing start error:', error);
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('typing:stop')
  async handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: number; receiverId: number },
  ) {
    try {
      const userId = client.handshake.auth.userId;

      await this.redisService.removeTypingIndicator(payload.conversationId, userId);

      // Notify receiver
      const receiverSocketId = await this.redisService.getUserSocketId(payload.receiverId);
      if (receiverSocketId) {
        this.server.to(receiverSocketId).emit('typing:indicator', {
          conversationId: payload.conversationId,
          userId,
          isTyping: false,
        });
      }
    } catch (error) {
      this.logger.error('Typing stop error:', error);
    }
  }

  // ==================== Conversation Rooms ====================

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('conversation:join')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: number },
  ) {
    const roomName = `conversation:${payload.conversationId}`;
    await client.join(roomName);
    this.logger.log(`Client ${client.id} joined ${roomName}`);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('conversation:leave')
  async handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: number },
  ) {
    const roomName = `conversation:${payload.conversationId}`;
    await client.leave(roomName);
    this.logger.log(`Client ${client.id} left ${roomName}`);
  }

  // ==================== Helper Methods ====================

  private async deliverMessage(receiverId: number, message: any) {
    const receiverSocketId = await this.redisService.getUserSocketId(receiverId);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('message:receive', message);

      // Increment unread count
      await this.redisService.incrementUnreadCount(receiverId, message.conversationId);
    }
  }

  private async deliverOfflineMessages(client: Socket, userId: number) {
    const offlineMessages = await this.redisService.getOfflineMessages(userId);
    if (offlineMessages.length > 0) {
      client.emit('offline:messages', offlineMessages);
      this.logger.log(`Delivered ${offlineMessages.length} offline messages to user ${userId}`);
    }
  }

  private async broadcastUserStatus(userId: number, status: 'online' | 'offline') {
    // Get user's contacts (followers who also follow back)
    const contacts = await this.messagingService.getUserContacts(userId);

    for (const contactId of contacts) {
      const socketId = await this.redisService.getUserSocketId(contactId);
      if (socketId) {
        this.server.to(socketId).emit('user:status', {
          userId,
          status,
          timestamp: new Date(),
        });
      }
    }
  }

  /**
   * Subscribe to Redis pub/sub channels for horizontal scaling
   * This allows multiple WebSocket servers to communicate
   */
  private subscribeToRedisChannels() {
    // Subscribe to new messages
    this.redisService.subscribe('message:new', async (data) => {
      await this.deliverMessage(data.receiverId, data);
    });

    // Subscribe to status updates
    this.redisService.subscribe('message:status', (data) => {
      this.server.emit('message:status', data);
    });

    this.logger.log('Subscribed to Redis pub/sub channels');
  }
}
