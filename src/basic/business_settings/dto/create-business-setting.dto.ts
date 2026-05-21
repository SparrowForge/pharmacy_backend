import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateBusinessSettingDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  shop_id?: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  setting_key: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  setting_value?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  data_type?: string;
}
