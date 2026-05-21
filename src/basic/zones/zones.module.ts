import { Module } from '@nestjs/common';
import { BasicCrudModule } from '../common/basic-crud.module';
import { ZonesController } from './zones.controller';
import { ZonesService } from './zones.service';

@Module({
  imports: [BasicCrudModule],
  controllers: [ZonesController],
  providers: [ZonesService],
})
export class ZonesModule {}
