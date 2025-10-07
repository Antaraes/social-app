import { IsNotEmpty, IsString, IsInt, IsArray, IsOptional, MaxLength } from 'class-validator';

export class SendMessageDto {
  @IsNotEmpty()
  @IsInt()
  receiverId: number;

  @IsNotEmpty()
  @IsString()
  @MaxLength(5000)
  content: string;

  @IsOptional()
  @IsArray()
  attachments?: any[];
}
