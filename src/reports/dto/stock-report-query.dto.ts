import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class StockReportQueryDto {
  @ApiProperty({
    description: 'Range start date (inclusive), format YYYY-MM-DD',
    example: '2026-01-01',
  })
  @IsDateString()
  start_date: string;

  @ApiProperty({
    description: 'Range end date (inclusive), format YYYY-MM-DD',
    example: '2026-01-31',
  })
  @IsDateString()
  end_date: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Filter by product category' })
  @IsOptional()
  @IsUUID()
  category_id?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Filter by a single product' })
  @IsOptional()
  @IsUUID()
  product_id?: string;
}
