import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateCommentDto } from './dto/create-commet.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class CommentsService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(
    postId: number,
    createCommentDto: CreateCommentDto,
    userId: number,
  ) {
    const { content, parentId } = createCommentDto;

    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        user: true,
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    let parentComment: any = null;
    if (parentId) {
      parentComment = await this.prisma.comment.findUnique({
        where: { id: parentId },
        include: {
          user: true,
        },
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

    // Emit notification events
    if (parentComment && parentComment.userId !== userId) {
      // Reply to a comment
      this.eventEmitter.emit('notification.create', {
        userId: parentComment.userId,
        type: 'COMMENT_REPLY',
        actorId: userId,
        entityType: 'comment',
        entityId: comment.id,
        message: `replied to your comment`,
        priority: 'MEDIUM',
        channels: ['web'],
      });
    } else if (post.userId !== userId) {
      // Comment on a post
      this.eventEmitter.emit('notification.create', {
        userId: post.userId,
        type: 'POST_COMMENT',
        actorId: userId,
        entityType: 'post',
        entityId: postId,
        message: `commented on your post "${post.title}"`,
        priority: 'MEDIUM',
        channels: ['web'],
      });
    }

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

  async update(
    commentId: number,
    updateCommentDto: UpdateCommentDto,
    userId: number,
  ) {
    const existingComment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!existingComment) {
      throw new NotFoundException('Comment not found');
    }

    if (existingComment.userId !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    const updatedComment = await this.prisma.comment.update({
      where: { id: commentId },
      data: { content: updateCommentDto.content },
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

    return updatedComment;
  }

  async remove(commentId: number, userId: number) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    // Delete the comment (cascade will handle children)
    await this.prisma.comment.delete({
      where: { id: commentId },
    });

    return { message: `Comment with ID ${commentId} deleted successfully` };
  }
}
