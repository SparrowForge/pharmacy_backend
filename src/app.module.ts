import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { AuditsModule } from './audits/audits.module';
import { BasicTablesModule } from './basic/basic-tables.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { DatabaseModule } from './database/database.module';
import { PurchaseModule } from './purchase/purchase.module';
import { PurchaseReturnModule } from './purchase-return/purchase-return.module';
import { PurchaseReceiptsModule } from './purchase-receipts/purchase-receipts.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ReportsModule } from './reports/reports.module';
import { SalesModule } from './sales/sales.module';
import { SalesReturnModule } from './sales-return/sales-return.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    DatabaseModule,
    CloudinaryModule,
    AuthModule,
    UsersModule,
    AuditsModule,
    BasicTablesModule,
    PurchaseModule,
    PurchaseReturnModule,
    PurchaseReceiptsModule,
    DashboardModule,
    ReportsModule,
    SalesModule,
    SalesReturnModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
