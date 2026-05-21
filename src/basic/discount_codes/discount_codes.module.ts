import { Module } from '@nestjs/common';
import { BasicCrudModule } from '../common/basic-crud.module';
import { DiscountCodesController } from './discount_codes.controller';
import { DiscountCodesService } from './discount_codes.service';

@Module({
  imports: [BasicCrudModule],
  controllers: [DiscountCodesController],
  providers: [DiscountCodesService],
})
export class DiscountCodesModule {}
