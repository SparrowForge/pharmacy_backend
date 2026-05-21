import { Module } from '@nestjs/common';
import { BasicCrudModule } from '../common/basic-crud.module';
import { CompanyContactsController } from './company_contacts.controller';
import { CompanyContactsService } from './company_contacts.service';

@Module({
  imports: [BasicCrudModule],
  controllers: [CompanyContactsController],
  providers: [CompanyContactsService],
})
export class CompanyContactsModule {}
