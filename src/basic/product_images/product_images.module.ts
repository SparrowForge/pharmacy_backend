import { Module } from '@nestjs/common';
import { BasicCrudModule } from '../common/basic-crud.module';
import { ProductImagesController } from './product_images.controller';
import { ProductImagesService } from './product_images.service';

@Module({
  imports: [BasicCrudModule],
  controllers: [ProductImagesController],
  providers: [ProductImagesService],
})
export class ProductImagesModule {}
