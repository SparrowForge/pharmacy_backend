import { Module } from '@nestjs/common';
import { BasicCrudModule } from '../common/basic-crud.module';
import { DivisionsController } from './divisions.controller';
import { DivisionsService } from './divisions.service';

@Module({
  imports: [BasicCrudModule],
  controllers: [DivisionsController],
  providers: [DivisionsService],
})
export class DivisionsModule {}
