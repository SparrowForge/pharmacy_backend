import { Module } from '@nestjs/common';
import { BasicCrudModule } from '../common/basic-crud.module';
import { ProductBadgesController } from './product_badges.controller';
import { ProductBadgesService } from './product_badges.service';

@Module({
  imports: [BasicCrudModule],
  controllers: [ProductBadgesController],
  providers: [ProductBadgesService],
})
export class ProductBadgesModule {}
