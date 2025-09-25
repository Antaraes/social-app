import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PrismaService } from 'prisma/prisma.service';
import { join } from 'path';
import * as fs from 'fs/promises';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async create(createPostDto: CreatePostDto, userId: number) {
    const post = await this.prisma.post.create({
      data: {
        ...createPostDto,
        userId,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { comments: true, reactions: true },
        },
      },
    });
    return {
      ...post,
      userReaction: null, // No reaction yet for new post
      reactionCounts: { LIKE: 0, LOVE: 0, HAHA: 0, WOW: 0, SAD: 0, ANGRY: 0 },
    };
  }

  private async deleteFileIfExists(filePath: string) {
    try {
      await fs.unlink(join(process.cwd(), filePath));
    } catch (err) {
      // Ignore if file not found
    }
  }

  async findAll(cursor?: number, limit: number = 10, userId?: number) {
    const posts = await this.prisma.post.findMany({
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
        _count: { select: { comments: true, reactions: true } },
        reactions: {
          select: { type: true, userId: true },
        },
      },
    });

    const enrichedPosts = await Promise.all(
      posts.map(async (post) => {
        const reactionCounts = post.reactions.reduce(
          (acc, reaction) => {
            acc[reaction.type] = (acc[reaction.type] || 0) + 1;
            return acc;
          },
          { LIKE: 0, LOVE: 0, HAHA: 0, WOW: 0, SAD: 0, ANGRY: 0 },
        );

        // Check if the current user has reacted
        const userReaction = userId
          ? post.reactions.find((r) => r.userId === userId)?.type || null
          : null;

        return {
          ...post,
          userReaction,
          reactionCounts,
          reactions: undefined,
        };
      }),
    );

    return {
      data: enrichedPosts,
      nextCursor: enrichedPosts.length
        ? enrichedPosts[enrichedPosts.length - 1].id
        : null,
    };
  }

  async findMyPosts(userId: number, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const posts = await this.prisma.post.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        _count: {
          select: { comments: true, reactions: true },
        },
        reactions: {
          select: { type: true, userId: true },
        },
      },
    });

    const total = await this.prisma.post.count({ where: { userId } });

    const enrichedPosts = posts.map((post) => {
      const reactionCounts = post.reactions.reduce(
        (acc, reaction) => {
          acc[reaction.type] = (acc[reaction.type] || 0) + 1;
          return acc;
        },
        { LIKE: 0, LOVE: 0, HAHA: 0, WOW: 0, SAD: 0, ANGRY: 0 },
      );

      const userReaction =
        post.reactions.find((r) => r.userId === userId)?.type || null;

      return {
        ...post,
        userReaction,
        reactionCounts,
        reactions: undefined,
      };
    });

    return {
      data: enrichedPosts,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number, userId?: number) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { comments: true, reactions: true },
        },
        reactions: {
          select: { type: true, userId: true },
        },
      },
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    const reactionCounts = post.reactions.reduce(
      (acc, reaction) => {
        acc[reaction.type] = (acc[reaction.type] || 0) + 1;
        return acc;
      },
      { LIKE: 0, LOVE: 0, HAHA: 0, WOW: 0, SAD: 0, ANGRY: 0 },
    );

    const userReaction = userId
      ? post.reactions.find((r) => r.userId === userId)?.type || null
      : null;

    return {
      ...post,
      userReaction,
      reactionCounts,
      reactions: undefined,
    };
  }

  async update(id: number, updatePostDto: UpdatePostDto, userId: number) {
    const existingPost = await this.prisma.post.findUnique({ where: { id } });

    if (!existingPost) throw new NotFoundException('Post not found');
    if (existingPost.userId !== userId)
      throw new ForbiddenException('You can only edit your own posts');

    if (updatePostDto.image && existingPost.image) {
      await this.deleteFileIfExists(existingPost.image);
    }

    const updatedPost = await this.prisma.post.update({
      where: { id },
      data: updatePostDto,
      include: {
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { comments: true, reactions: true } },
        reactions: { select: { type: true, userId: true } },
      },
    });

    const reactionCounts = updatedPost.reactions.reduce(
      (acc, reaction) => {
        acc[reaction.type] = (acc[reaction.type] || 0) + 1;
        return acc;
      },
      { LIKE: 0, LOVE: 0, HAHA: 0, WOW: 0, SAD: 0, ANGRY: 0 },
    );

    const userReaction =
      updatedPost.reactions.find((r) => r.userId === userId)?.type || null;

    return {
      ...updatedPost,
      userReaction,
      reactionCounts,
      reactions: undefined,
    };
  }
  async remove(id: number, userId: number) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException(`Post with ID ${id} not found`);
    if (post.userId !== userId)
      throw new ForbiddenException('You can only delete your own posts');

    await this.prisma.comment.deleteMany({ where: { postId: id } });

    await this.prisma.reaction.deleteMany({ where: { postId: id } });

    if (post.image) {
      await this.deleteFileIfExists(post.image);
    }

    await this.prisma.post.delete({ where: { id } });

    return { message: `Post with ID ${id} deleted successfully` };
  }
}
