import { Injectable } from '@nestjs/common';
import { BasicCrudService } from '../common/basic-crud.service';
import { CreateCompanyAddressDto } from './dto/create-company-address.dto';
import { ListCompanyAddressesQueryDto } from './dto/list-company-addresses-query.dto';
import { UpdateCompanyAddressDto } from './dto/update-company-address.dto';

@Injectable()
export class CompanyAddressesService {
  private readonly entity = 'company_addresses';
  private readonly table = 'phar_company_addresses';

  constructor(private readonly basicCrudService: BasicCrudService) {}

  list(query: ListCompanyAddressesQueryDto) {
    return this.basicCrudService.list(this.entity, this.table, query);
  }

  getById(id: string) {
    return this.basicCrudService.getById(this.entity, this.table, id);
  }

  create(dto: CreateCompanyAddressDto) {
    return this.basicCrudService.create(this.entity, this.table, dto);
  }

  update(id: string, dto: UpdateCompanyAddressDto) {
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
