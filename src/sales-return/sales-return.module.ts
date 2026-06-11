import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { SalesReturnController } from './sales-return.controller';
import { SalesReturnService } from './sales-return.service';

@Module({
  imports: [DatabaseModule],
  controllers: [SalesReturnController],
  providers: [SalesReturnService],
})
export class SalesReturnModule {}
