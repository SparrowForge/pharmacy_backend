import { Module } from '@nestjs/common';
import { BasicCrudModule } from '../common/basic-crud.module';
import { WarehousesController } from './warehouses.controller';
import { WarehousesService } from './warehouses.service';

@Module({
  imports: [BasicCrudModule],
  controllers: [WarehousesController],
  providers: [WarehousesService],
})
export class WarehousesModule {}
