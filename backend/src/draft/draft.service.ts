import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

export interface CreateDraftDto {
  title?: string;
  content: string;
  image?: string;
}

export interface UpdateDraftDto {
  title?: string;
  content?: string;
  image?: string;
}

@Injectable()
export class DraftService {
  constructor(private prisma: PrismaService) {}

  async createOrUpdateDraft(userId: number, draftData: CreateDraftDto | UpdateDraftDto, draftId?: number) {
    if (draftId) {
      const existingDraft = await this.prisma.draft.findFirst({
        where: { id: draftId, userId },
      });

      if (!existingDraft) {
        throw new NotFoundException('Draft not found');
      }

      return this.prisma.draft.update({
        where: { id: draftId },
        data: draftData,
      });
    }

    return this.prisma.draft.create({
      data: {
        ...(draftData as CreateDraftDto),
        userId,
      },
    });
  }

  async getDrafts(userId: number) {
    return this.prisma.draft.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getDraft(userId: number, draftId: number) {
    const draft = await this.prisma.draft.findFirst({
      where: { id: draftId, userId },
    });

    if (!draft) {
      throw new NotFoundException('Draft not found');
    }

    return draft;
  }

  async deleteDraft(userId: number, draftId: number) {
    const draft = await this.prisma.draft.findFirst({
      where: { id: draftId, userId },
    });

    if (!draft) {
      throw new NotFoundException('Draft not found');
    }

    await this.prisma.draft.delete({
      where: { id: draftId },
    });

    return { message: 'Draft deleted successfully' };
  }

  async deleteAllDrafts(userId: number) {
    await this.prisma.draft.deleteMany({
      where: { userId },
    });

    return { message: 'All drafts deleted successfully' };
  }
}
