import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { BasicCrudService } from './basic-crud.service';

@Module({
  imports: [DatabaseModule],
  providers: [BasicCrudService],
  exports: [BasicCrudService],
})
export class BasicCrudModule {}
