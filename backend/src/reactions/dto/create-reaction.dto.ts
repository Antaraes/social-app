import { IsEnum } from 'class-validator';
import { ReactionType } from '@prisma/client';

export class CreateReactionDto {
  @IsEnum(ReactionType, { message: 'Invalid reaction type' })
  type: ReactionType;
}
