import { Module } from '@nestjs/common';
import { BasicCrudModule } from '../common/basic-crud.module';
import { ProductBrandsController } from './product_brands.controller';
import { ProductBrandsService } from './product_brands.service';

@Module({
  imports: [BasicCrudModule],
  controllers: [ProductBrandsController],
  providers: [ProductBrandsService],
})
export class ProductBrandsModule {}
