import { Module } from '@nestjs/common';
import { BasicCrudModule } from '../common/basic-crud.module';
import { LinesController } from './lines.controller';
import { LinesService } from './lines.service';

@Module({
  imports: [BasicCrudModule],
  controllers: [LinesController],
  providers: [LinesService],
})
export class LinesModule {}
