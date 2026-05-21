import { Module } from '@nestjs/common';
import { BasicCrudModule } from '../common/basic-crud.module';
import { PaymentMethodsController } from './payment_methods.controller';
import { PaymentMethodsService } from './payment_methods.service';

@Module({
  imports: [BasicCrudModule],
  controllers: [PaymentMethodsController],
  providers: [PaymentMethodsService],
})
export class PaymentMethodsModule {}
