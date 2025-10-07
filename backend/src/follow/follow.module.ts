import { Module } from '@nestjs/common';
import { FollowService } from './follow.service';
import { FollowController } from './follow.controller';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  providers: [FollowService, PrismaService],
  controllers: [FollowController],
  exports: [FollowService],
})
export class FollowModule {}
