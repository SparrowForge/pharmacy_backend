import { Module } from '@nestjs/common';
import { BasicCrudModule } from '../common/basic-crud.module';
import { ProductTagsController } from './product_tags.controller';
import { ProductTagsService } from './product_tags.service';

@Module({
  imports: [BasicCrudModule],
  controllers: [ProductTagsController],
  providers: [ProductTagsService],
})
export class ProductTagsModule {}
