import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

export interface RedisStreamMessage {
  id: string;
  conversationId: number;
  senderId: number;
  receiverId: number;
  content: string;
  attachments?: any[];
  timestamp: number;
}

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;
  private readonly subscriber: Redis;
  private readonly publisher: Redis;

  constructor(private configService: ConfigService) {
    const redisConfig = {
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD') || undefined,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    };

    this.client = new Redis(redisConfig);
    this.subscriber = new Redis(redisConfig);
    this.publisher = new Redis(redisConfig);

    this.client.on('error', (err) =>
      this.logger.error('Redis Client Error', err),
    );
    this.subscriber.on('error', (err) =>
      this.logger.error('Redis Subscriber Error', err),
    );
    this.publisher.on('error', (err) =>
      this.logger.error('Redis Publisher Error', err),
    );
  }

  // ==================== Stream Operations ====================

  /**
   * Add message to Redis Stream for fast retrieval
   * Stream key format: messages:conversation:{conversationId}
   */
  async addMessageToStream(
    conversationId: number,
    message: Omit<RedisStreamMessage, 'id'>,
  ): Promise<string> {
    const streamKey = `messages:conversation:${conversationId}`;

    const messageId = await this.client.xadd(
      streamKey,
      '*', // Auto-generate ID
      'conversationId',
      message.conversationId.toString(),
      'senderId',
      message.senderId.toString(),
      'receiverId',
      message.receiverId.toString(),
      'content',
      message.content,
      'attachments',
      JSON.stringify(message.attachments || []),
      'timestamp',
      message.timestamp.toString(),
    );

    // Set TTL on stream (e.g., 7 days)
    await this.client.expire(streamKey, 604800);

    return messageId || '';
  }

  /**
   * Get messages from stream with pagination
   */
  async getMessagesFromStream(
    conversationId: number,
    startId: string = '-',
    count: number = 50,
  ): Promise<RedisStreamMessage[]> {
    const streamKey = `messages:conversation:${conversationId}`;

    const messages = await this.client.xrevrange(
      streamKey,
      '+',
      startId,
      'COUNT',
      count,
    );

    return messages.map(([id, fields]) => ({
      id,
      conversationId: parseInt(fields[1]),
      senderId: parseInt(fields[3]),
      receiverId: parseInt(fields[5]),
      content: fields[7],
      attachments: JSON.parse(fields[9] || '[]'),
      timestamp: parseInt(fields[11]),
    }));
  }

  /**
   * Get recent messages (last N messages)
   */
  async getRecentMessages(
    conversationId: number,
    count: number = 50,
  ): Promise<RedisStreamMessage[]> {
    return this.getMessagesFromStream(conversationId, '+', count);
  }

  // ==================== Pub/Sub Operations ====================

  /**
   * Publish message to channel for real-time distribution
   * Used for horizontal scaling across multiple WebSocket servers
   */
  async publishMessage(channel: string, data: any): Promise<number> {
    return this.publisher.publish(channel, JSON.stringify(data));
  }

  /**
   * Subscribe to channel
   */
  async subscribe(
    channel: string,
    callback: (message: any) => void,
  ): Promise<void> {
    await this.subscriber.subscribe(channel);

    this.subscriber.on('message', (ch, message) => {
      if (ch === channel) {
        try {
          const data = JSON.parse(message);
          callback(data);
        } catch (error) {
          this.logger.error(
            `Error parsing message from channel ${channel}:`,
            error,
          );
        }
      }
    });
  }

  /**
   * Unsubscribe from channel
   */
  async unsubscribe(channel: string): Promise<void> {
    await this.subscriber.unsubscribe(channel);
  }

  // ==================== Caching Operations ====================

  /**
   * Cache user online status
   * Key format: user:online:{userId}
   */
  async setUserOnline(userId: number, socketId: string): Promise<void> {
    const key = `user:online:${userId}`;
    await this.client.setex(key, 3600, socketId); // 1 hour TTL
  }

  async setUserOffline(userId: number): Promise<void> {
    const key = `user:online:${userId}`;
    await this.client.del(key);
  }

  async isUserOnline(userId: number): Promise<boolean> {
    const key = `user:online:${userId}`;
    const result = await this.client.exists(key);
    return result === 1;
  }

  async getUserSocketId(userId: number): Promise<string | null> {
    const key = `user:online:${userId}`;
    return this.client.get(key);
  }

  /**
   * Cache typing indicator
   * Key format: typing:{conversationId}:{userId}
   */
  async setTypingIndicator(
    conversationId: number,
    userId: number,
  ): Promise<void> {
    const key = `typing:${conversationId}:${userId}`;
    await this.client.setex(key, 5, 'typing'); // 5 seconds TTL
  }

  async removeTypingIndicator(
    conversationId: number,
    userId: number,
  ): Promise<void> {
    const key = `typing:${conversationId}:${userId}`;
    await this.client.del(key);
  }

  async isUserTyping(conversationId: number, userId: number): Promise<boolean> {
    const key = `typing:${conversationId}:${userId}`;
    const result = await this.client.exists(key);
    return result === 1;
  }

  /**
   * Cache unread message count
   * Key format: unread:{userId}:{conversationId}
   */
  async incrementUnreadCount(
    userId: number,
    conversationId: number,
  ): Promise<number> {
    const key = `unread:${userId}:${conversationId}`;
    return this.client.incr(key);
  }

  async resetUnreadCount(
    userId: number,
    conversationId: number,
  ): Promise<void> {
    const key = `unread:${userId}:${conversationId}`;
    await this.client.del(key);
  }

  async getUnreadCount(
    userId: number,
    conversationId: number,
  ): Promise<number> {
    const key = `unread:${userId}:${conversationId}`;
    const count = await this.client.get(key);
    return count ? parseInt(count) : 0;
  }

  /**
   * Rate limiting for spam protection
   * Key format: rate:message:{userId}
   */
  async checkMessageRateLimit(
    userId: number,
    limit: number = 10,
    window: number = 60,
  ): Promise<boolean> {
    const key = `rate:message:${userId}`;
    const current = await this.client.incr(key);

    if (current === 1) {
      await this.client.expire(key, window);
    }

    return current <= limit;
  }

  /**
   * Cache last seen timestamp
   * Key format: last_seen:{userId}
   */
  async updateLastSeen(userId: number): Promise<void> {
    const key = `last_seen:${userId}`;
    await this.client.set(key, Date.now().toString());
  }

  async getLastSeen(userId: number): Promise<number | null> {
    const key = `last_seen:${userId}`;
    const timestamp = await this.client.get(key);
    return timestamp ? parseInt(timestamp) : null;
  }

  // ==================== Offline Message Queue ====================

  /**
   * Queue messages for offline users
   * Key format: offline_queue:{userId}
   */
  async queueOfflineMessage(userId: number, messageData: any): Promise<void> {
    const key = `offline_queue:${userId}`;
    await this.client.rpush(key, JSON.stringify(messageData));
    await this.client.expire(key, 604800); // 7 days TTL
  }

  async getOfflineMessages(userId: number): Promise<any[]> {
    const key = `offline_queue:${userId}`;
    const messages = await this.client.lrange(key, 0, -1);

    if (messages.length > 0) {
      await this.client.del(key);
    }

    return messages.map((msg) => JSON.parse(msg));
  }

  // ==================== Cleanup ====================

  async onModuleDestroy() {
    await this.client.quit();
    await this.subscriber.quit();
    await this.publisher.quit();
  }

  // Expose raw clients if needed
  getClient(): Redis {
    return this.client;
  }

  getSubscriber(): Redis {
    return this.subscriber;
  }

  getPublisher(): Redis {
    return this.publisher;
  }
}
