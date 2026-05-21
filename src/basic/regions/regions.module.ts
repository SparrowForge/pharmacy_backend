import { Module } from '@nestjs/common';
import { BasicCrudModule } from '../common/basic-crud.module';
import { RegionsController } from './regions.controller';
import { RegionsService } from './regions.service';

@Module({
  imports: [BasicCrudModule],
  controllers: [RegionsController],
  providers: [RegionsService],
})
export class RegionsModule {}
