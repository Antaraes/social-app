import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  UseGuards,
  Req,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { FollowService } from './follow.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('follow')
@UseGuards(JwtAuthGuard)
export class FollowController {
  constructor(private readonly followService: FollowService) {}

  /**
   * Follow a user
   * POST /follow/:userId
   */
  @Post(':userId')
  async followUser(@Req() req, @Param('userId', ParseIntPipe) userId: number) {
    return this.followService.followUser(req.user.id, userId);
  }

  /**
   * Unfollow a user
   * DELETE /follow/:userId
   */
  @Delete(':userId')
  async unfollowUser(@Req() req, @Param('userId', ParseIntPipe) userId: number) {
    return this.followService.unfollowUser(req.user.id, userId);
  }

  /**
   * Get followers of a user
   * GET /follow/followers/:userId?page=1&limit=20
   */
  @Get('followers/:userId')
  async getFollowers(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 20;
    return this.followService.getFollowers(userId, pageNum, limitNum);
  }

  /**
   * Get users that a user is following
   * GET /follow/following/:userId?page=1&limit=20
   */
  @Get('following/:userId')
  async getFollowing(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 20;
    return this.followService.getFollowing(userId, pageNum, limitNum);
  }

  /**
   * Get follower/following counts for a user
   * GET /follow/counts/:userId
   */
  @Get('counts/:userId')
  async getFollowCounts(@Param('userId', ParseIntPipe) userId: number) {
    return this.followService.getFollowCounts(userId);
  }

  /**
   * Check if current user is following another user
   * GET /follow/status/:userId
   */
  @Get('status/:userId')
  async getFollowStatus(@Req() req, @Param('userId', ParseIntPipe) userId: number) {
    const isFollowing = await this.followService.isFollowing(req.user.id, userId);
    return { isFollowing };
  }
}
