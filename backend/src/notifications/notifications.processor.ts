import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Processor('notifications')
@Injectable()
export class NotificationsProcessor extends WorkerHost {
  constructor(private prisma: PrismaService) {
    super();
  }

  async process(job: Job): Promise<any> {
    console.log(`Processing job: ${job.name} with ID: ${job.id}`);

    try {
      switch (job.name) {
        case 'send-email':
          return await this.sendEmailNotification(job.data);
        case 'send-push':
          return await this.sendPushNotification(job.data);
        case 'batch-digest':
          return await this.sendBatchDigest(job.data);
        default:
          console.warn(`Unknown job type: ${job.name}`);
          return null;
      }
    } catch (error) {
      console.error(`Error processing job ${job.name}:`, error.message);
      throw error; // Let BullMQ handle retries
    }
  }

  private async sendEmailNotification(data: {
    notificationId: number;
    userId: number;
  }) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: data.notificationId },
      include: {
        user: true,
        actor: true,
      },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    // TODO: Implement email service integration
    // await this.emailService.send({
    //   to: notification.user.email,
    //   subject: this.getEmailSubject(notification.type),
    //   template: 'notification',
    //   context: {
    //     userName: notification.user.name,
    //     actorName: notification.actor?.name,
    //     message: notification.message,
    //     link: this.getNotificationLink(notification),
    //   },
    // });

    console.log(
      `[EMAIL] Notification ${data.notificationId} would be sent to ${notification.user.email}`,
    );
    console.log(`Subject: ${this.getEmailSubject(notification.type)}`);
    console.log(`Message: ${notification.message}`);

    // Update sent channels
    await this.prisma.notification.update({
      where: { id: data.notificationId },
      data: {
        sentChannels: {
          ...(notification.sentChannels as any),
          email: true,
        },
      },
    });

    return { sent: true };
  }

  private async sendPushNotification(data: {
    notificationId: number;
    userId: number;
  }) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: data.notificationId },
      include: {
        user: true,
        actor: true,
      },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    // TODO: Implement push notification service integration
    // await this.pushService.send({
    //   userId: data.userId,
    //   title: this.getPushTitle(notification.type),
    //   body: notification.message,
    //   data: {
    //     notificationId: notification.id,
    //     type: notification.type,
    //   },
    // });

    console.log(
      `[PUSH] Notification ${data.notificationId} would be pushed to user ${data.userId}`,
    );
    console.log(`Title: ${this.getPushTitle(notification.type)}`);
    console.log(`Body: ${notification.message}`);

    // Update sent channels
    await this.prisma.notification.update({
      where: { id: data.notificationId },
      data: {
        sentChannels: {
          ...(notification.sentChannels as any),
          push: true,
        },
      },
    });

    return { sent: true };
  }

  private async sendBatchDigest(data: { userId: number }) {
    // Get unread notifications from last 24 hours
    const notifications = await this.prisma.notification.findMany({
      where: {
        userId: data.userId,
        isRead: false,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
      include: {
        actor: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (notifications.length === 0) {
      console.log(`No unread notifications for user ${data.userId}`);
      return { sent: false };
    }

    // Group by type
    const grouped = notifications.reduce(
      (acc, notif) => {
        if (!acc[notif.type]) {
          acc[notif.type] = [];
        }
        acc[notif.type].push(notif);
        return acc;
      },
      {} as Record<string, any[]>,
    );

    // TODO: Send digest email
    // await this.emailService.send({
    //   to: user.email,
    //   subject: `You have ${notifications.length} new notifications`,
    //   template: 'digest',
    //   context: {
    //     notifications: grouped,
    //     count: notifications.length,
    //   },
    // });

    console.log(
      `[DIGEST] ${notifications.length} notifications digest would be sent to user ${data.userId}`,
    );

    return { sent: true, count: notifications.length };
  }

  private getEmailSubject(type: string): string {
    const subjects: Record<string, string> = {
      FOLLOW: 'New follower!',
      POST_LIKE: 'Someone liked your post',
      POST_COMMENT: 'New comment on your post',
      COMMENT_REPLY: 'Someone replied to your comment',
      MENTION_POST: 'You were mentioned in a post',
      MENTION_COMMENT: 'You were mentioned in a comment',
      SYSTEM_ALERT: 'System notification',
      SECURITY_ALERT: 'Security alert',
    };
    return subjects[type] || 'New notification';
  }

  private getPushTitle(type: string): string {
    return this.getEmailSubject(type);
  }

  private getNotificationLink(notification: any): string {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    switch (notification.entityType) {
      case 'post':
        return `${baseUrl}/posts/${notification.entityId}`;
      case 'user':
        return `${baseUrl}/profile/${notification.entityId}`;
      default:
        return `${baseUrl}/notifications`;
    }
  }
}
