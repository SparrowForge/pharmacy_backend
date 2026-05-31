import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { AuditsModule } from './audits/audits.module';
import { BasicTablesModule } from './basic/basic-tables.module';
import { DatabaseModule } from './database/database.module';
import { PurchaseModule } from './purchase/purchase.module';
import { SalesModule } from './sales/sales.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    UsersModule,
    AuditsModule,
    BasicTablesModule,
    PurchaseModule,
    SalesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
