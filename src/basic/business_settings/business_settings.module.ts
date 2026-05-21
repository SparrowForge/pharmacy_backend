import { Module } from '@nestjs/common';
import { BasicCrudModule } from '../common/basic-crud.module';
import { BusinessSettingsController } from './business_settings.controller';
import { BusinessSettingsService } from './business_settings.service';

@Module({
  imports: [BasicCrudModule],
  controllers: [BusinessSettingsController],
  providers: [BusinessSettingsService],
})
export class BusinessSettingsModule {}
