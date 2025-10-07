import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { OnEvent } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  // Map of userId -> socketId[]
  private userSockets = new Map<number, Set<string>>();

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      // Authenticate WebSocket connection
      const token = client.handshake.auth.token;

      if (!token) {
        console.log('WebSocket connection rejected: No token provided');
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });
      const userId = payload.id;

      // Store user -> socket mapping
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      let sockets = this.userSockets.get(userId);
      if (!sockets) {
        sockets = new Set<string>();
        this.userSockets.set(userId, sockets);
      }
      sockets.add(client.id);

      // Join user-specific room
      client.join(`user:${userId}`);

      console.log(`User ${userId} connected to notifications: ${client.id}`);
    } catch (error) {
      console.error('WebSocket auth error:', error.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    // Remove socket from user mapping
    this.userSockets.forEach((sockets, userId) => {
      if (sockets.has(client.id)) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.userSockets.delete(userId);
        }
        console.log(`User ${userId} disconnected: ${client.id}`);
      }
    });
  }

  @OnEvent('notification.created')
  handleNotificationCreated(payload: { userId: number; notification: any }) {
    // Send to all connected sockets for this user
    this.server.to(`user:${payload.userId}`).emit('notification', {
      type: 'new',
      data: payload.notification,
    });

    console.log(
      `Notification sent to user ${payload.userId}: ${payload.notification.type}`,
    );
  }

  @SubscribeMessage('mark-read')
  handleMarkRead(client: Socket, notificationId: number) {
    // Emit to other sessions of the same user
    const userId = this.getUserIdFromSocket(client);
    if (userId) {
      this.server.to(`user:${userId}`).emit('notification', {
        type: 'marked-read',
        data: { id: notificationId },
      });
    }
  }

  @SubscribeMessage('mark-all-read')
  handleMarkAllRead(client: Socket) {
    const userId = this.getUserIdFromSocket(client);
    if (userId) {
      this.server.to(`user:${userId}`).emit('notification', {
        type: 'all-marked-read',
      });
    }
  }

  private getUserIdFromSocket(client: Socket): number | null {
    for (const [userId, sockets] of this.userSockets.entries()) {
      if (sockets.has(client.id)) {
        return userId;
      }
    }
    return null;
  }
}
