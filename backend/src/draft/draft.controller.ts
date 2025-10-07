import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { DraftService } from './draft.service';
import type { CreateDraftDto, UpdateDraftDto } from './draft.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('drafts')
@UseGuards(JwtAuthGuard)
export class DraftController {
  constructor(private readonly draftService: DraftService) {}

  @Post()
  async createDraft(@Req() req, @Body() draftData: CreateDraftDto) {
    return this.draftService.createOrUpdateDraft(req.user.id, draftData);
  }

  @Put(':id')
  async updateDraft(
    @Req() req,
    @Param('id', ParseIntPipe) draftId: number,
    @Body() draftData: UpdateDraftDto,
  ) {
    return this.draftService.createOrUpdateDraft(req.user.id, draftData, draftId);
  }

  @Get()
  async getDrafts(@Req() req) {
    return this.draftService.getDrafts(req.user.id);
  }

  @Get(':id')
  async getDraft(@Req() req, @Param('id', ParseIntPipe) draftId: number) {
    return this.draftService.getDraft(req.user.id, draftId);
  }

  @Delete(':id')
  async deleteDraft(@Req() req, @Param('id', ParseIntPipe) draftId: number) {
    return this.draftService.deleteDraft(req.user.id, draftId);
  }

  @Delete()
  async deleteAllDrafts(@Req() req) {
    return this.draftService.deleteAllDrafts(req.user.id);
  }
}
