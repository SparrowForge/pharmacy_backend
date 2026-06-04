import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { PurchaseModule } from '../purchase/purchase.module';
import { PurchaseReturnController } from './purchase-return.controller';
import { PurchaseReturnService } from './purchase-return.service';

@Module({
  imports: [DatabaseModule, PurchaseModule],
  controllers: [PurchaseReturnController],
  providers: [PurchaseReturnService],
})
export class PurchaseReturnModule {}
