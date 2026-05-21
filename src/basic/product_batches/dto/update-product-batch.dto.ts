import { PartialType } from '@nestjs/swagger';
import { CreateProductBatchDto } from './create-product-batch.dto';

export class UpdateProductBatchDto extends PartialType(CreateProductBatchDto) {}
