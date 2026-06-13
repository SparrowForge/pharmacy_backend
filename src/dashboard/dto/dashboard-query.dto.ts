import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class DashboardSummaryQueryDto {
  @ApiPropertyOptional({ default: 30, description: 'Days ahead to check for expiring batches' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  expiry_days?: number;
}

export class DashboardPageQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

export class DashboardExpiryQueryDto extends DashboardPageQueryDto {
  @ApiPropertyOptional({ default: 30, description: 'Days ahead to check for expiring batches' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  days?: number;
}
