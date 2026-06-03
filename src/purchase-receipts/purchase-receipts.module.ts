import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { PurchaseModule } from '../purchase/purchase.module';
import { PurchaseReceiptsController } from './purchase-receipts.controller';
import { PurchaseReceiptsService } from './purchase-receipts.service';

@Module({
  imports: [DatabaseModule, PurchaseModule],
  controllers: [PurchaseReceiptsController],
  providers: [PurchaseReceiptsService],
})
export class PurchaseReceiptsModule {}
