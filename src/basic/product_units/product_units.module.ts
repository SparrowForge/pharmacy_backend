import { Module } from '@nestjs/common';
import { BasicCrudModule } from '../common/basic-crud.module';
import { ProductUnitsController } from './product_units.controller';
import { ProductUnitsService } from './product_units.service';

@Module({
  imports: [BasicCrudModule],
  controllers: [ProductUnitsController],
  providers: [ProductUnitsService],
})
export class ProductUnitsModule {}
