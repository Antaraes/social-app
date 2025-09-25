// reactions.controller.ts
import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  Get,
} from '@nestjs/common';
import { ReactionsService } from './reactions.service';
import { CreateReactionDto } from './dto/create-reaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('reactions')
export class ReactionsController {
  constructor(private readonly reactionsService: ReactionsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('posts/:postId')
  async toggleReaction(
    @Param('postId') postId: string,
    @Body() createReactionDto: CreateReactionDto,
    @Req() req,
  ) {
    return await this.reactionsService.toggleReaction(
      +postId,
      createReactionDto,
      req.user.id,
    );
  }

  @Get('posts/:postId')
  async getReactions(@Param('postId') postId: string, @Req() req) {
    const userId = req.user?.id;
    return await this.reactionsService.getReactions(+postId, userId);
  }
}
