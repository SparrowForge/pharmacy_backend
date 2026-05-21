import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class CleanupAuditsDto {
  @ApiPropertyOptional({
    default: 90,
    minimum: 1,
    maximum: 3650,
    description: 'Delete logs older than N days',
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3650)
  olderThanDays = 90;
}
