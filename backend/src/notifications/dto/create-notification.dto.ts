import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateNotificationDto {
  @IsInt()
  @IsNotEmpty()
  userId: number;

  @IsEnum([
    'FOLLOW',
    'UNFOLLOW',
    'POST_LIKE',
    'POST_COMMENT',
    'POST_SHARE',
    'COMMENT_LIKE',
    'COMMENT_REPLY',
    'MENTION_POST',
    'MENTION_COMMENT',
    'TAG_POST',
    'SYSTEM_ALERT',
    'ACCOUNT_UPDATE',
    'SECURITY_ALERT',
    'MESSAGE_RECEIVED',
    'MILESTONE',
  ])
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsInt()
  @IsOptional()
  actorId?: number;

  @IsString()
  @IsOptional()
  entityType?: string;

  @IsInt()
  @IsOptional()
  entityId?: number;

  @IsOptional()
  metadata?: any;

  @IsEnum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
  @IsOptional()
  priority?: string;

  @IsOptional()
  channels?: string[];
}
