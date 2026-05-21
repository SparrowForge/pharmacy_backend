import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateCompanyContactDto } from './dto/create-company-contact.dto';
import { ListCompanyContactsQueryDto } from './dto/list-company-contacts-query.dto';
import { UpdateCompanyContactDto } from './dto/update-company-contact.dto';
import { CompanyContactsService } from './company_contacts.service';

@ApiTags('CompanyContacts')
@Controller('company_contacts')
export class CompanyContactsController {
  constructor(private readonly companyContactsService: CompanyContactsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all company_contacts with pagination and filters' })
  list(@Query() query: ListCompanyContactsQueryDto) {
    return this.companyContactsService.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create company_contact' })
  create(@Body() dto: CreateCompanyContactDto) {
    return this.companyContactsService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get company_contact by id' })
  getById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.companyContactsService.getById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update company_contact by id' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateCompanyContactDto,
  ) {
    return this.companyContactsService.update(id, dto);
  }

  @Delete(':id/permanent')
  @ApiOperation({ summary: 'Permanently delete company_contact by id' })
  permanentDelete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.companyContactsService.permanentDelete(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete company_contact by id' })
  softDelete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.companyContactsService.softDelete(id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore soft-deleted company_contact' })
  restore(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.companyContactsService.restore(id);
  }
}
