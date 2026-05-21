import { Injectable } from '@nestjs/common';
import { BasicCrudService } from '../common/basic-crud.service';
import { CreateCompanyContactDto } from './dto/create-company-contact.dto';
import { ListCompanyContactsQueryDto } from './dto/list-company-contacts-query.dto';
import { UpdateCompanyContactDto } from './dto/update-company-contact.dto';

@Injectable()
export class CompanyContactsService {
  private readonly entity = 'company_contacts';
  private readonly table = 'phar_company_contacts';

  constructor(private readonly basicCrudService: BasicCrudService) {}

  list(query: ListCompanyContactsQueryDto) {
    return this.basicCrudService.list(this.entity, this.table, query);
  }

  getById(id: string) {
    return this.basicCrudService.getById(this.entity, this.table, id);
  }

  create(dto: CreateCompanyContactDto) {
    return this.basicCrudService.create(this.entity, this.table, dto);
  }

  update(id: string, dto: UpdateCompanyContactDto) {
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
