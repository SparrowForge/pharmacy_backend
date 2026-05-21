import { Module } from '@nestjs/common';
import { BasicCrudModule } from '../common/basic-crud.module';
import { RoutesController } from './routes.controller';
import { RoutesService } from './routes.service';

@Module({
  imports: [BasicCrudModule],
  controllers: [RoutesController],
  providers: [RoutesService],
})
export class RoutesModule {}
