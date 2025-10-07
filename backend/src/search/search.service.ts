import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async search(query: string, userId?: number, limit: number = 10) {
    const searchTerm = `%${query}%`;

    const [users, posts, hashtags] = await Promise.all([
      // Search users
      this.prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { bio: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          bio: true,
          _count: {
            select: {
              followers: true,
              following: true,
              posts: true,
            },
          },
        },
        take: limit,
      }),

      // Search posts
      this.prisma.post.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { content: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              comments: true,
              reactions: true,
            },
          },
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),

      // Search hashtags
      this.prisma.hashtag.findMany({
        where: {
          name: { contains: query, mode: 'insensitive' },
        },
        include: {
          _count: {
            select: {
              posts: true,
            },
          },
        },
        take: limit,
        orderBy: {
          posts: {
            _count: 'desc',
          },
        },
      }),
    ]);

    // Save search history if user is logged in
    if (userId && query.trim()) {
      await this.prisma.searchHistory.create({
        data: {
          userId,
          query: query.trim(),
        },
      });
    }

    return {
      users: users.map(user => ({
        ...user,
        followersCount: user._count.followers,
        followingCount: user._count.following,
        postsCount: user._count.posts,
      })),
      posts: posts.map(post => ({
        ...post,
        commentsCount: post._count.comments,
        reactionsCount: post._count.reactions,
      })),
      hashtags: hashtags.map(tag => ({
        ...tag,
        postsCount: tag._count.posts,
      })),
    };
  }

  async searchHashtag(hashtagName: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const hashtag = await this.prisma.hashtag.findUnique({
      where: { name: hashtagName.replace('#', '') },
      include: {
        posts: {
          skip,
          take: limit,
          include: {
            post: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatar: true,
                  },
                },
                _count: {
                  select: {
                    comments: true,
                    reactions: true,
                  },
                },
              },
            },
          },
          orderBy: {
            post: {
              createdAt: 'desc',
            },
          },
        },
        _count: {
          select: {
            posts: true,
          },
        },
      },
    });

    if (!hashtag) {
      return {
        hashtag: null,
        posts: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }

    const total = hashtag._count.posts;

    return {
      hashtag: {
        id: hashtag.id,
        name: hashtag.name,
        postsCount: total,
      },
      posts: hashtag.posts.map(p => ({
        ...p.post,
        commentsCount: p.post._count.comments,
        reactionsCount: p.post._count.reactions,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getSearchHistory(userId: number, limit: number = 10) {
    const history = await this.prisma.searchHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      distinct: ['query'],
    });

    return history;
  }

  async deleteSearchHistory(userId: number) {
    await this.prisma.searchHistory.deleteMany({
      where: { userId },
    });

    return { message: 'Search history cleared' };
  }

  async getSuggestions(query: string, limit: number = 5) {
    if (!query || query.length < 2) {
      return { users: [], hashtags: [] };
    }

    const [users, hashtags] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          name: { contains: query, mode: 'insensitive' },
        },
        select: {
          id: true,
          name: true,
          avatar: true,
        },
        take: limit,
      }),
      this.prisma.hashtag.findMany({
        where: {
          name: { contains: query, mode: 'insensitive' },
        },
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              posts: true,
            },
          },
        },
        take: limit,
      }),
    ]);

    return {
      users,
      hashtags: hashtags.map(tag => ({
        ...tag,
        postsCount: tag._count.posts,
      })),
    };
  }
}
