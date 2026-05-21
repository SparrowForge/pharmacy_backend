import { Module } from '@nestjs/common';
import { BasicCrudModule } from '../common/basic-crud.module';
import { DistrictsController } from './districts.controller';
import { DistrictsService } from './districts.service';

@Module({
  imports: [BasicCrudModule],
  controllers: [DistrictsController],
  providers: [DistrictsService],
})
export class DistrictsModule {}
