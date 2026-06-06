import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { BasicCrudModule } from '../common/basic-crud.module';
import { MediaFilesController } from './media_files.controller';
import { MediaFilesService } from './media_files.service';

@Module({
  imports: [BasicCrudModule, DatabaseModule],
  controllers: [MediaFilesController],
  providers: [MediaFilesService],
})
export class MediaFilesModule {}
