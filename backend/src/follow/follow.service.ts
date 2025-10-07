import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class FollowService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async followUser(followerId: number, followingId: number) {
    if (followerId === followingId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    // Check if user exists
    const userToFollow = await this.prisma.user.findUnique({
      where: { id: followingId },
    });

    if (!userToFollow) {
      throw new NotFoundException('User not found');
    }

    // Check if already following
    const existingFollow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (existingFollow) {
      throw new BadRequestException('Already following this user');
    }

    const follow = await this.prisma.follow.create({
      data: {
        followerId,
        followingId,
      },
      include: {
        following: {
          select: {
            id: true,
            name: true,
            avatar: true,
            bio: true,
          },
        },
      },
    });

    // Emit notification event
    this.eventEmitter.emit('notification.create', {
      userId: followingId,
      type: 'FOLLOW',
      actorId: followerId,
      entityType: 'user',
      entityId: followerId,
      message: `started following you`,
      priority: 'MEDIUM',
      channels: ['web'],
    });

    return follow;
  }

  async unfollowUser(followerId: number, followingId: number) {
    const follow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (!follow) {
      throw new NotFoundException('You are not following this user');
    }

    return this.prisma.follow.delete({
      where: {
        id: follow.id,
      },
    });
  }

  async getFollowers(userId: number, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [followers, total] = await Promise.all([
      this.prisma.follow.findMany({
        where: { followingId: userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          follower: {
            select: {
              id: true,
              name: true,
              avatar: true,
              bio: true,
              _count: {
                select: {
                  followers: true,
                  following: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.follow.count({
        where: { followingId: userId },
      }),
    ]);

    return {
      data: followers.map(f => f.follower),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getFollowing(userId: number, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [following, total] = await Promise.all([
      this.prisma.follow.findMany({
        where: { followerId: userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          following: {
            select: {
              id: true,
              name: true,
              avatar: true,
              bio: true,
              _count: {
                select: {
                  followers: true,
                  following: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.follow.count({
        where: { followerId: userId },
      }),
    ]);

    return {
      data: following.map(f => f.following),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getFollowCounts(userId: number) {
    const [followersCount, followingCount] = await Promise.all([
      this.prisma.follow.count({
        where: { followingId: userId },
      }),
      this.prisma.follow.count({
        where: { followerId: userId },
      }),
    ]);

    return {
      followersCount,
      followingCount,
    };
  }

  async isFollowing(followerId: number, followingId: number) {
    const follow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    return !!follow;
  }

  async getMutualFollows(userId: number) {
    // Get users that the current user follows
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    // Get users that follow the current user
    const followers = await this.prisma.follow.findMany({
      where: { followingId: userId },
      select: { followerId: true },
    });

    // Find mutual follows (intersection)
    const followingIds = following.map(f => f.followingId);
    const followerIds = followers.map(f => f.followerId);
    const mutualIds = followingIds.filter(id => followerIds.includes(id));

    // Fetch user details for mutual follows
    const mutualFollows = await this.prisma.user.findMany({
      where: { id: { in: mutualIds } },
      select: {
        id: true,
        name: true,
        avatar: true,
        bio: true,
      },
    });

    // Map to Friend interface format with mutualFollows flag
    return mutualFollows.map(user => ({
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      isOnline: false, // TODO: Implement online status tracking with Redis
      mutualFollows: true,
    }));
  }
}
