import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { MessagingService } from './messaging.service';
import { SendMessageDto } from './dto/send-message.dto';
import { MarkReadDto } from './dto/mark-read.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { messageAttachmentConfig, validateFileSize, getFileType } from './config/multer.config';

@ApiTags('messaging')
@ApiBearerAuth()
@Controller('messaging')
@UseGuards(JwtAuthGuard)
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  /**
   * Get user's conversation list
   * GET /messaging/conversations
   */
  @Get('conversations')
  @ApiOperation({ summary: 'Get conversation list' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Conversation list retrieved' })
  async getConversations(
    @Request() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    const userId = req.user.id;
    return this.messagingService.getConversations(userId, page, limit);
  }

  /**
   * Create or get conversation with another user
   * POST /messaging/conversations
   */
  @Post('conversations')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create or get conversation with another user' })
  @ApiResponse({
    status: 200,
    description: 'Conversation created or retrieved',
  })
  @ApiResponse({ status: 403, description: 'Users must follow each other' })
  async createConversation(
    @Request() req,
    @Body() body: { participantId: number },
  ) {
    const userId = req.user.id;
    const { participantId } = body;

    // Check if users can message each other
    const canMessage = await this.messagingService.canUsersMessage(
      userId,
      participantId,
    );
    if (!canMessage) {
      throw new ForbiddenException(
        'You can only message users who follow you back',
      );
    }

    // Get or create conversation
    const conversation = await this.messagingService.getOrCreateConversation(
      userId,
      participantId,
    );

    // Return conversation with other user details
    const otherUserId =
      conversation.participant1 === userId
        ? conversation.participant2
        : conversation.participant1;
    const otherUser = await this.messagingService.getUserById(otherUserId);

    return {
      ...conversation,
      otherUser: {
        id: otherUser.id,
        name: otherUser.name,
        avatar: otherUser.avatar,
      },
    };
  }

  /**
   * Get chat history for a conversation
   * GET /messaging/conversations/:conversationId/messages
   */
  @Get('conversations/:conversationId/messages')
  @ApiOperation({ summary: 'Get chat history' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Chat history retrieved' })
  @ApiResponse({
    status: 403,
    description: 'Unauthorized access to conversation',
  })
  async getChatHistory(
    @Request() req,
    @Param('conversationId', ParseIntPipe) conversationId: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ) {
    const userId = req.user.id;
    return this.messagingService.getChatHistory(
      conversationId,
      userId,
      page,
      limit,
    );
  }

  /**
   * Send a new message (HTTP endpoint as fallback)
   * POST /messaging/send
   */
  @Post('send')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send a new message (HTTP fallback)' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  @ApiResponse({
    status: 403,
    description: 'Users must follow each other to message',
  })
  async sendMessage(@Request() req, @Body() sendMessageDto: SendMessageDto) {
    const senderId = req.user.id;
    return this.messagingService.sendMessage({
      senderId,
      receiverId: sendMessageDto.receiverId,
      content: sendMessageDto.content,
      attachments: sendMessageDto.attachments,
    });
  }

  /**
   * Mark messages as read
   * POST /messaging/mark-read
   */
  @Post('mark-read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark messages as read' })
  @ApiResponse({ status: 200, description: 'Messages marked as read' })
  async markAsRead(@Request() req, @Body() markReadDto: MarkReadDto) {
    const userId = req.user.id;
    await this.messagingService.markMessagesAsRead(
      markReadDto.messageIds,
      userId,
    );
    return { success: true };
  }

  /**
   * Search messages in a conversation
   * GET /messaging/conversations/:conversationId/search
   */
  @Get('conversations/:conversationId/search')
  @ApiOperation({ summary: 'Search messages in conversation' })
  @ApiQuery({ name: 'q', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Search results' })
  async searchMessages(
    @Request() req,
    @Param('conversationId', ParseIntPipe) conversationId: number,
    @Query('q') query: string,
  ) {
    const userId = req.user.id;
    return this.messagingService.searchMessages(conversationId, userId, query);
  }

  /**
   * Check if user can message another user
   * GET /messaging/can-message/:userId
   */
  @Get('can-message/:userId')
  @ApiOperation({ summary: 'Check if users can message each other' })
  @ApiResponse({
    status: 200,
    description: 'Returns whether users can message',
  })
  async canMessage(
    @Request() req,
    @Param('userId', ParseIntPipe) otherUserId: number,
  ) {
    const userId = req.user.id;
    const canMessage = await this.messagingService.canUsersMessage(
      userId,
      otherUserId,
    );
    return { canMessage };
  }

  /**
   * Get user's contacts (mutual follows)
   * GET /messaging/contacts
   */
  @Get('contacts')
  @ApiOperation({ summary: 'Get user contacts (mutual follows)' })
  @ApiResponse({ status: 200, description: 'Contact list retrieved' })
  async getContacts(@Request() req) {
    const userId = req.user.id;
    return this.messagingService.getUserContacts(userId);
  }

  /**
   * Get unread message count
   * GET /messaging/unread-count
   */
  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread message count' })
  @ApiResponse({ status: 200, description: 'Unread count retrieved' })
  async getUnreadCount(@Request() req) {
    const userId = req.user.id;
    const count = await this.messagingService.getUnreadCount(userId);
    return { count };
  }

  /**
   * Upload message attachments
   * POST /messaging/upload-attachments
   */
  @Post('upload-attachments')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FilesInterceptor('files', 5, messageAttachmentConfig))
  @ApiOperation({ summary: 'Upload message attachments' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Files uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file type or size' })
  async uploadAttachments(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    // Validate each file size based on type
    files.forEach((file) => validateFileSize(file));

    // Format file information for response
    const attachments = files.map((file) => ({
      filename: file.filename,
      originalName: file.originalname,
      path: `/uploads/messages/${file.filename}`,
      mimetype: file.mimetype,
      size: file.size,
      type: getFileType(file.mimetype),
    }));

    return {
      success: true,
      attachments,
    };
  }
}
