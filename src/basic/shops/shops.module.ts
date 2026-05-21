import { Module } from '@nestjs/common';
import { BasicCrudModule } from '../common/basic-crud.module';
import { ShopsController } from './shops.controller';
import { ShopsService } from './shops.service';

@Module({
  imports: [BasicCrudModule],
  controllers: [ShopsController],
  providers: [ShopsService],
})
export class ShopsModule {}
