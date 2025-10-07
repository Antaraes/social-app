import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaClient, MessageStatus } from '@prisma/client';
import { RedisService } from '../redis/redis.service';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);
  private readonly prisma = new PrismaClient();

  constructor(private readonly redisService: RedisService) {}

  // ==================== Authorization Checks ====================

  /**
   * Check if two users can message each other (mutual follow required)
   */
  async canUsersMessage(userId1: number, userId2: number): Promise<boolean> {
    const mutualFollow = await this.prisma.follow.findMany({
      where: {
        OR: [
          { followerId: userId1, followingId: userId2 },
          { followerId: userId2, followingId: userId1 },
        ],
      },
    });

    // Both users must follow each other
    return mutualFollow.length === 2;
  }

  /**
   * Check if user is part of a conversation
   */
  async isUserInConversation(
    userId: number,
    conversationId: number,
  ): Promise<boolean> {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ participant1: userId }, { participant2: userId }],
      },
    });

    return !!conversation;
  }

  // ==================== Message Operations ====================

  /**
   * Send a new message
   */
  async sendMessage(data: {
    senderId: number;
    receiverId: number;
    content: string;
    attachments?: any[];
  }) {
    const { senderId, receiverId, content, attachments } = data;

    // Ensure users can message each other
    const canMessage = await this.canUsersMessage(senderId, receiverId);
    if (!canMessage) {
      throw new ForbiddenException(
        'You can only message users who follow you back',
      );
    }

    // Get or create conversation
    const conversation = await this.getOrCreateConversation(
      senderId,
      receiverId,
    );

    // Create message in database
    const message = await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId,
        receiverId,
        content,
        attachments: attachments || [],
        status: MessageStatus.SENT,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    // Add to Redis stream for fast retrieval
    const redisMessageId = await this.redisService.addMessageToStream(
      conversation.id,
      {
        conversationId: conversation.id,
        senderId,
        receiverId,
        content,
        attachments: attachments || [],
        timestamp: message.createdAt.getTime(),
      },
    );

    // Update message with Redis ID
    await this.prisma.message.update({
      where: { id: message.id },
      data: { redisMessageId },
    });

    // Update conversation last message
    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageId: message.id,
        lastMessageAt: message.createdAt,
        lastMessageText: content.substring(0, 255),
        updatedAt: new Date(),
      },
    });

    return message;
  }

  /**
   * Get or create conversation between two users
   */
  async getOrCreateConversation(userId1: number, userId2: number) {
    // Ensure consistent ordering
    const [participant1, participant2] =
      userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];

    let conversation = await this.prisma.conversation.findFirst({
      where: {
        participant1,
        participant2,
      },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          participant1,
          participant2,
        },
      });
    }

    return conversation;
  }

  /**
   * Mark message as delivered
   */
  async markMessageDelivered(messageId: number, userId: number) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.receiverId !== userId) {
      throw new ForbiddenException('Unauthorized');
    }

    await this.prisma.message.update({
      where: { id: messageId },
      data: {
        status: MessageStatus.DELIVERED,
        deliveredAt: new Date(),
      },
    });
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(messageIds: number[], userId: number) {
    await this.prisma.message.updateMany({
      where: {
        id: { in: messageIds },
        receiverId: userId,
      },
      data: {
        status: MessageStatus.READ,
        readAt: new Date(),
      },
    });
  }

  /**
   * Get message by ID
   */
  async getMessageById(messageId: number) {
    return this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });
  }

  /**
   * Get messages by IDs
   */
  async getMessagesByIds(messageIds: number[]) {
    return this.prisma.message.findMany({
      where: { id: { in: messageIds } },
    });
  }

  // ==================== Conversation Operations ====================

  /**
   * Get user's conversation list
   */
  async getConversations(userId: number, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [{ participant1: userId }, { participant2: userId }],
      },
      include: {
        user1: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        user2: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      skip,
      take: limit,
    });

    // Get unread counts from Redis
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await this.redisService.getUnreadCount(
          userId,
          conv.id,
        );
        const otherUser =
          conv.participant1 === userId ? conv.user2 : conv.user1;
        const isOnline = await this.redisService.isUserOnline(otherUser.id);

        return {
          ...conv,
          otherUser,
          unreadCount,
          isOnline,
        };
      }),
    );

    return conversationsWithUnread;
  }

  /**
   * Get chat history with pagination
   */
  async getChatHistory(
    conversationId: number,
    userId: number,
    page: number = 1,
    limit: number = 50,
  ) {
    // Verify user access
    const hasAccess = await this.isUserInConversation(userId, conversationId);
    if (!hasAccess) {
      throw new ForbiddenException(
        'You do not have access to this conversation',
      );
    }

    // Try to get from Redis stream first
    try {
      const redisMessages = await this.redisService.getRecentMessages(
        conversationId,
        limit,
      );
      if (redisMessages.length > 0) {
        this.logger.log(
          `Retrieved ${redisMessages.length} messages from Redis`,
        );
        return {
          messages: redisMessages,
          source: 'redis',
        };
      }
    } catch (error) {
      this.logger.warn(
        'Failed to fetch from Redis, falling back to database:',
        error,
      );
    }

    // Fallback to database
    const skip = (page - 1) * limit;

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    return {
      messages,
      source: 'database',
    };
  }

  /**
   * Get user contacts (users who mutually follow)
   */
  async getUserContacts(userId: number): Promise<number[]> {
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followers = await this.prisma.follow.findMany({
      where: { followingId: userId },
      select: { followerId: true },
    });

    const followingIds = new Set(following.map((f) => f.followingId));
    const followerIds = new Set(followers.map((f) => f.followerId));

    // Mutual follows (intersection)
    const contacts = [...followingIds].filter((id) => followerIds.has(id));

    return contacts;
  }

  /**
   * Get unread message count for a user
   */
  async getUnreadCount(userId: number): Promise<number> {
    const count = await this.prisma.message.count({
      where: {
        receiverId: userId,
        status: {
          in: [MessageStatus.SENT, MessageStatus.DELIVERED],
        },
      },
    });

    return count;
  }

  // ==================== Search & Discovery ====================

  /**
   * Search messages in a conversation
   */
  async searchMessages(conversationId: number, userId: number, query: string) {
    const hasAccess = await this.isUserInConversation(userId, conversationId);
    if (!hasAccess) {
      throw new ForbiddenException(
        'You do not have access to this conversation',
      );
    }

    return this.prisma.message.findMany({
      where: {
        conversationId,
        content: {
          contains: query,
          mode: 'insensitive',
        },
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        avatar: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
