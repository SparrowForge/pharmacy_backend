import { Module } from '@nestjs/common';
import { BasicCrudModule } from '../common/basic-crud.module';
import { MediaFilesController } from './media_files.controller';
import { MediaFilesService } from './media_files.service';

@Module({
  imports: [BasicCrudModule],
  controllers: [MediaFilesController],
  providers: [MediaFilesService],
})
export class MediaFilesModule {}
