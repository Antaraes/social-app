import { IsNotEmpty, IsArray, IsInt } from 'class-validator';

export class MarkReadDto {
  @IsNotEmpty()
  @IsArray()
  @IsInt({ each: true })
  messageIds: number[];

  @IsNotEmpty()
  @IsInt()
  conversationId: number;
}
