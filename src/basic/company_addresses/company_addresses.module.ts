import { Module } from '@nestjs/common';
import { BasicCrudModule } from '../common/basic-crud.module';
import { CompanyAddressesController } from './company_addresses.controller';
import { CompanyAddressesService } from './company_addresses.service';

@Module({
  imports: [BasicCrudModule],
  controllers: [CompanyAddressesController],
  providers: [CompanyAddressesService],
})
export class CompanyAddressesModule {}
