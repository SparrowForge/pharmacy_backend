import { Injectable } from '@nestjs/common';
import { BasicCrudService } from '../common/basic-crud.service';
import { CreateCountryDto } from './dto/create-country.dto';
import { ListCountriesQueryDto } from './dto/list-countries-query.dto';
import { UpdateCountryDto } from './dto/update-country.dto';

@Injectable()
export class CountriesService {
  private readonly entity = 'countries';
  private readonly table = 'phar_countries';

  constructor(private readonly basicCrudService: BasicCrudService) {}

  list(query: ListCountriesQueryDto) {
    return this.basicCrudService.list(this.entity, this.table, query);
  }

  getById(id: string) {
    return this.basicCrudService.getById(this.entity, this.table, id);
  }

  create(dto: CreateCountryDto) {
    return this.basicCrudService.create(this.entity, this.table, dto);
  }

  update(id: string, dto: UpdateCountryDto) {
    return this.basicCrudService.update(this.entity, this.table, id, dto);
  }

  softDelete(id: string) {
    return this.basicCrudService.softDelete(this.entity, this.table, id);
  }

  restore(id: string) {
    return this.basicCrudService.restore(this.entity, this.table, id);
  }

  permanentDelete(id: string) {
    return this.basicCrudService.permanentDelete(this.entity, this.table, id);
  }
}
