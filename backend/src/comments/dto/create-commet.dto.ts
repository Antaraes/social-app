import { IsNotEmpty, IsString, IsOptional, IsInt } from 'class-validator';

export class CreateCommentDto {
  @IsNotEmpty()
  @IsString()
  content: string;

  @IsOptional()
  @IsInt()
  parentId?: number;
}
