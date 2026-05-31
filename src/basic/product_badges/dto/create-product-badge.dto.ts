import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsString, IsUUID } from 'class-validator';

export class CreateProductBadgeDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  product_id: string;

  @ApiProperty({
    type: [String],
    example: ['featured', 'hot-deal'],
  })
  @Transform(({ value }) =>
    Array.isArray(value) ? value : value !== undefined ? [value] : [],
  )
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  badge: string[];
}
