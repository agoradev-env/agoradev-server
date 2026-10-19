import { IsUUID, IsOptional, IsDateString } from 'class-validator';

export class BaseDto {
  @IsUUID()
  @IsOptional()
  id?: string;

  @IsDateString()
  @IsOptional()
  created_at?: string;

  @IsDateString()
  @IsOptional()
  updated_at?: string;
}
