import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { ListBasicQueryDto } from '../../dto/list-basic-query.dto';

export class ListProductBatchesQueryDto extends ListBasicQueryDto {
  @ApiPropertyOptional({ description: 'Filter by product_id' })
  @IsOptional()
  @IsString()
  product_id?: string;
}
