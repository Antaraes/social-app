import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class WsThrottleGuard implements CanActivate {
  private readonly logger = new Logger(WsThrottleGuard.name);

  // Rate limit: 10 messages per 60 seconds
  private readonly MESSAGE_LIMIT = 10;
  private readonly WINDOW_SECONDS = 60;

  constructor(private redisService: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient<Socket>();
      const userId = client.handshake.auth.userId;

      if (!userId) {
        throw new WsException('Unauthorized: User not identified');
      }

      const allowed = await this.redisService.checkMessageRateLimit(
        userId,
        this.MESSAGE_LIMIT,
        this.WINDOW_SECONDS,
      );

      if (!allowed) {
        this.logger.warn(`Rate limit exceeded for user ${userId}`);
        throw new WsException('Rate limit exceeded. Please slow down.');
      }

      return true;
    } catch (error) {
      if (error instanceof WsException) {
        throw error;
      }
      this.logger.error('Throttle guard error:', error);
      throw new WsException('Internal error');
    }
  }
}
