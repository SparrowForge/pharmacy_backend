import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class StatementQueryDto {
  @ApiPropertyOptional({ description: 'Range start date (inclusive), format YYYY-MM-DD', example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({ description: 'Range end date (inclusive), format YYYY-MM-DD', example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  end_date?: string;
}
