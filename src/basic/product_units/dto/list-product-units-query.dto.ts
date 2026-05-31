import { ListBasicQueryDto } from '../../dto/list-basic-query.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { PRODUCT_UNIT_TYPES } from './create-product-unit.dto';

export class ListProductUnitsQueryDto extends ListBasicQueryDto {
  @ApiPropertyOptional({
    enum: PRODUCT_UNIT_TYPES,
    description: 'Filter by exact unit type',
  })
  @IsOptional()
  @IsString()
  @IsIn(PRODUCT_UNIT_TYPES)
  unit_type?: (typeof PRODUCT_UNIT_TYPES)[number];
}
