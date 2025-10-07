import { Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    @InjectQueue('notifications') private notificationQueue: Queue,
  ) {}

  @OnEvent('notification.create')
  async handleNotificationCreate(payload: CreateNotificationDto) {
    await this.create(payload);
  }

  async create(data: CreateNotificationDto) {
    // Check user notification settings
    const settings = await this.getUserSettings(data.userId);

    if (!this.shouldSendNotification(settings, data.type)) {
      return null;
    }

    // Create notification in database
    const notification = await this.prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type as any,
        message: data.message,
        actorId: data.actorId,
        entityType: data.entityType,
        entityId: data.entityId,
        metadata: data.metadata || {},
        priority: (data.priority || 'MEDIUM') as any,
        channels: data.channels || ['web'],
        sentChannels: {},
      },
      include: {
        actor: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    // Emit event for real-time delivery (WebSocket)
    this.eventEmitter.emit('notification.created', {
      userId: data.userId,
      notification,
    });

    // Queue email/push notifications
    if (data.channels?.includes('email') && settings.emailEnabled) {
      await this.notificationQueue.add(
        'send-email',
        {
          notificationId: notification.id,
          userId: data.userId,
        },
        {
          priority: notification.priority === 'URGENT' ? 1 : 10,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      );
    }

    if (data.channels?.includes('push') && settings.pushEnabled) {
      await this.notificationQueue.add(
        'send-push',
        {
          notificationId: notification.id,
          userId: data.userId,
        },
        {
          priority: notification.priority === 'URGENT' ? 1 : 10,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      );
    }

    return notification;
  }

  async findAll(
    userId: number,
    options?: {
      skip?: number;
      take?: number;
      unreadOnly?: boolean;
      type?: string;
    },
  ) {
    const where: any = { userId };

    if (options?.unreadOnly) {
      where.isRead = false;
    }

    if (options?.type) {
      where.type = options.type;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        include: {
          actor: {
            select: { id: true, name: true, avatar: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: options?.skip || 0,
        take: options?.take || 20,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return {
      notifications,
      total,
      unreadCount,
      hasMore: (options?.skip || 0) + notifications.length < total,
    };
  }

  async getUnreadCount(userId: number): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(userId: number, notificationId: number) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(userId: number) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async delete(userId: number, notificationId: number) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    return this.prisma.notification.delete({
      where: { id: notificationId },
    });
  }

  async getUserSettings(userId: number) {
    let settings = await this.prisma.notificationSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await this.prisma.notificationSettings.create({
        data: { userId },
      });
    }

    return settings;
  }

  async updateSettings(userId: number, data: UpdateNotificationSettingsDto) {
    return this.prisma.notificationSettings.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  }

  private shouldSendNotification(settings: any, type: string): boolean {
    // Check if notification type is enabled in user preferences
    const preferences = settings.preferences as any;

    if (preferences && preferences[type]) {
      return preferences[type].enabled !== false;
    }

    return true; // Default to enabled
  }

  // Helper method to create notification for multiple users (bulk)
  async createBulk(notifications: CreateNotificationDto[]) {
    const created = await this.prisma.notification.createMany({
      data: notifications.map((notif) => ({
        userId: notif.userId,
        type: notif.type as any,
        message: notif.message,
        actorId: notif.actorId,
        entityType: notif.entityType,
        entityId: notif.entityId,
        metadata: notif.metadata || {},
        priority: (notif.priority || 'MEDIUM') as any,
        channels: notif.channels || ['web'],
        sentChannels: {},
      })),
    });

    // Emit events for real-time delivery
    notifications.forEach((notif) => {
      this.eventEmitter.emit('notification.created', {
        userId: notif.userId,
        notification: notif,
      });
    });

    return created;
  }
}
