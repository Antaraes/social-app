import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtGuard.name);

  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient<Socket>();
      const token = this.extractToken(client);

      if (!token) {
        throw new WsException('Unauthorized: No token provided');
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });

      // Attach user to socket handshake
      client.handshake.auth.userId = payload.sub;
      client.handshake.auth.email = payload.email;

      return true;
    } catch (error) {
      this.logger.error('WebSocket JWT validation failed:', error.message);
      throw new WsException('Unauthorized: Invalid token');
    }
  }

  private extractToken(client: Socket): string | null {
    // Try to extract token from handshake auth
    if (client.handshake.auth?.token) {
      return client.handshake.auth.token;
    }

    // Try to extract from query params
    if (client.handshake.query?.token) {
      return client.handshake.query.token as string;
    }

    // Try to extract from headers
    const authHeader = client.handshake.headers?.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }
}
