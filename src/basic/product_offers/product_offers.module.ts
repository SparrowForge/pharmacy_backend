import { Module } from '@nestjs/common';
import { BasicCrudModule } from '../common/basic-crud.module';
import { ProductOffersController } from './product_offers.controller';
import { ProductOffersService } from './product_offers.service';

@Module({
  imports: [BasicCrudModule],
  controllers: [ProductOffersController],
  providers: [ProductOffersService],
})
export class ProductOffersModule {}
