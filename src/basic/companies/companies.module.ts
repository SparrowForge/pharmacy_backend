import { Module } from '@nestjs/common';
import { BasicCrudModule } from '../common/basic-crud.module';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';

@Module({
  imports: [BasicCrudModule],
  controllers: [CompaniesController],
  providers: [CompaniesService],
})
export class CompaniesModule {}
