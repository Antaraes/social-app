import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateCommentDto } from './dto/create-commet.dto';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async create(
    postId: number,
    createCommentDto: CreateCommentDto,
    userId: number,
  ) {
    const { content, parentId } = createCommentDto;

    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (parentId) {
      const parentComment = await this.prisma.comment.findUnique({
        where: { id: parentId },
      });

      if (!parentComment) {
        throw new NotFoundException('Parent comment not found');
      }

      if (parentComment.postId !== postId) {
        throw new NotFoundException(
          'Parent comment does not belong to this post',
        );
      }
    }

    const comment = await this.prisma.comment.create({
      data: {
        content,
        postId,
        userId,
        parentId,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        children: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
      },
    });
    return comment;
  }

  async findByPost(postId: number) {
    const comments = await this.prisma.comment.findMany({
      where: { postId, parentId: null },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        children: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
            children: {
              // Nested level 2
              orderBy: { createdAt: 'asc' },
              include: {
                user: {
                  select: { id: true, name: true, email: true, avatar: true },
                },
                children: {
                  // Nested level 3 (adjust depth as needed)
                  orderBy: { createdAt: 'asc' },
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return comments;
  }
}
