import { Module } from '@nestjs/common';
import { BasicCrudModule } from '../common/basic-crud.module';
import { ProductBatchesController } from './product_batches.controller';
import { ProductBatchesService } from './product_batches.service';

@Module({
  imports: [BasicCrudModule],
  controllers: [ProductBatchesController],
  providers: [ProductBatchesService],
})
export class ProductBatchesModule {}
