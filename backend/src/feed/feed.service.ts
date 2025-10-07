import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class FeedService {
  constructor(private prisma: PrismaService) {}

  async getFeed(userId: number, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    // Get users that the current user is following
    const followingIds = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingUserIds = followingIds.map(f => f.followingId);

    // Include the user's own posts in the feed
    const userIds = [userId, ...followingUserIds];

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: {
          userId: { in: userIds },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              bio: true,
            },
          },
          _count: {
            select: {
              comments: true,
              reactions: true,
            },
          },
          reactions: {
            where: { userId },
            select: { type: true },
          },
          hashtags: {
            include: {
              hashtag: true,
            },
          },
          mentions: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.post.count({
        where: {
          userId: { in: userIds },
        },
      }),
    ]);

    return {
      data: posts.map(post => ({
        ...post,
        commentsCount: post._count.comments,
        reactionsCount: post._count.reactions,
        userReaction: post.reactions[0]?.type || null,
        hashtags: post.hashtags.map(h => h.hashtag),
        mentions: post.mentions.map(m => m.user),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getExploreFeed(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        skip,
        take: limit,
        orderBy: [
          { reactionCount: 'desc' },
          { createdAt: 'desc' },
        ],
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              bio: true,
            },
          },
          _count: {
            select: {
              comments: true,
              reactions: true,
            },
          },
          hashtags: {
            include: {
              hashtag: true,
            },
          },
        },
      }),
      this.prisma.post.count(),
    ]);

    return {
      data: posts.map(post => ({
        ...post,
        commentsCount: post._count.comments,
        reactionsCount: post._count.reactions,
        hashtags: post.hashtags.map(h => h.hashtag),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
