import { IsBoolean, IsOptional, IsString, IsObject } from 'class-validator';

export class UpdateNotificationSettingsDto {
  @IsBoolean()
  @IsOptional()
  emailEnabled?: boolean;

  @IsBoolean()
  @IsOptional()
  pushEnabled?: boolean;

  @IsBoolean()
  @IsOptional()
  webEnabled?: boolean;

  @IsObject()
  @IsOptional()
  preferences?: any;

  @IsString()
  @IsOptional()
  quietHoursStart?: string;

  @IsString()
  @IsOptional()
  quietHoursEnd?: string;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsBoolean()
  @IsOptional()
  batchEmail?: boolean;

  @IsString()
  @IsOptional()
  batchFrequency?: string;
}
