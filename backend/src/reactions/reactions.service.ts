import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateReactionDto } from './dto/create-reaction.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ReactionsService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async toggleReaction(
    postId: number,
    createReactionDto: CreateReactionDto,
    userId: number,
  ) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) throw new NotFoundException('Post not found');

    const existingReaction = await this.prisma.reaction.findUnique({
      where: {
        postId_userId: { postId, userId },
      },
    });

    if (existingReaction) {
      // User is removing their reaction
      await this.prisma.reaction.delete({
        where: { postId_userId: { postId, userId } },
      });

      const updatedPost = await this.prisma.post.update({
        where: { id: postId },
        data: { reactionCount: { decrement: 1 } },
      });

      return {
        liked: false,
        reactionType: null,
        count: updatedPost.reactionCount,
      };
    }

    // User is adding a new reaction
    await this.prisma.reaction.create({
      data: {
        type: createReactionDto.type as any,
        postId,
        userId,
      },
    });

    const updatedPost = await this.prisma.post.update({
      where: { id: postId },
      data: { reactionCount: { increment: 1 } },
      include: {
        user: true,
      },
    });

    // Emit notification event (don't notify if user reacts to their own post)
    if (updatedPost.userId !== userId) {
      this.eventEmitter.emit('notification.create', {
        userId: updatedPost.userId,
        type: 'POST_LIKE',
        actorId: userId,
        entityType: 'post',
        entityId: postId,
        message: `reacted to your post "${updatedPost.title}"`,
        priority: 'LOW',
        channels: ['web'],
      });
    }

    return {
      liked: true,
      reactionType: createReactionDto.type,
      count: updatedPost.reactionCount,
    };
  }

  async getReactions(postId: number, userId?: number) {
    const reactions = await this.prisma.reaction.findMany({
      where: { postId },
      select: {
        type: true,
        user: { select: { id: true, name: true } },
      },
    });

    // Group reactions by type to get counts
    const reactionCounts = reactions.reduce(
      (acc, reaction) => {
        acc[reaction.type] = (acc[reaction.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Check if the current user has reacted
    let userReaction: string | null = null;
    if (userId) {
      const reaction = await this.prisma.reaction.findUnique({
        where: { postId_userId: { postId, userId } },
      });
      userReaction = reaction ? reaction.type : null;
    }

    return {
      reactions,
      counts: reactionCounts,
      userReaction,
    };
  }
}
