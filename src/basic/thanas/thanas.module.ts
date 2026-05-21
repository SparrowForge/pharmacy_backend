import { Module } from '@nestjs/common';
import { BasicCrudModule } from '../common/basic-crud.module';
import { ThanasController } from './thanas.controller';
import { ThanasService } from './thanas.service';

@Module({
  imports: [BasicCrudModule],
  controllers: [ThanasController],
  providers: [ThanasService],
})
export class ThanasModule {}
