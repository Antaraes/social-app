import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(
    @Req() req,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('type') type?: string,
  ) {
    return this.notificationsService.findAll(req.user.id, {
      skip: skip ? parseInt(skip, 10) : 0,
      take: take ? parseInt(take, 10) : 20,
      unreadOnly: unreadOnly === 'true',
      type,
    });
  }

  @Get('unread-count')
  async getUnreadCount(@Req() req) {
    const count = await this.notificationsService.getUnreadCount(req.user.id);
    return { unreadCount: count };
  }

  @Patch(':id/read')
  async markAsRead(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.notificationsService.markAsRead(req.user.id, id);
  }

  @Patch('read-all')
  async markAllAsRead(@Req() req) {
    return this.notificationsService.markAllAsRead(req.user.id);
  }

  @Delete(':id')
  async deleteNotification(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.notificationsService.delete(req.user.id, id);
  }

  @Get('settings')
  async getSettings(@Req() req) {
    return this.notificationsService.getUserSettings(req.user.id);
  }

  @Patch('settings')
  async updateSettings(
    @Req() req,
    @Body() updateSettingsDto: UpdateNotificationSettingsDto,
  ) {
    return this.notificationsService.updateSettings(
      req.user.id,
      updateSettingsDto,
    );
  }
}
