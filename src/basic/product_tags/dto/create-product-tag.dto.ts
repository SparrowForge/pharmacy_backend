import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsString, IsUUID } from 'class-validator';

export class CreateProductTagDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  product_id: string;

  @ApiProperty({
    type: [String],
    example: ['perferendis', 'parasitamal'],
  })
  @Transform(({ value }) =>
    Array.isArray(value) ? value : value !== undefined ? [value] : [],
  )
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  tag: string[];
}
