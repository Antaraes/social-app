import { Module } from '@nestjs/common';
import { DraftService } from './draft.service';
import { DraftController } from './draft.controller';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  providers: [DraftService, PrismaService],
  controllers: [DraftController],
  exports: [DraftService],
})
export class DraftModule {}
