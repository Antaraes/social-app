import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateCommentDto } from './dto/create-commet.dto';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('posts/:postId')
  async create(
    @Param('postId') postId: string,
    @Body() createCommentDto: CreateCommentDto,
    @Req() req,
  ) {
    return await this.commentsService.create(
      +postId,
      createCommentDto,
      req.user.id,
    );
  }

  @Get('posts/:postId')
  async getCommentsByPost(@Param('postId') postId: string) {
    return await this.commentsService.findByPost(+postId);
  }
}
