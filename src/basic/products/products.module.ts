import { Module } from '@nestjs/common';
import { BasicCrudModule } from '../common/basic-crud.module';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [BasicCrudModule],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
