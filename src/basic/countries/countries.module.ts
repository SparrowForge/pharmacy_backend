import { Module } from '@nestjs/common';
import { BasicCrudModule } from '../common/basic-crud.module';
import { CountriesController } from './countries.controller';
import { CountriesService } from './countries.service';

@Module({
  imports: [BasicCrudModule],
  controllers: [CountriesController],
  providers: [CountriesService],
})
export class CountriesModule {}
