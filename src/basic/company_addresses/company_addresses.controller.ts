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
import { CreateCompanyAddressDto } from './dto/create-company-address.dto';
import { ListCompanyAddressesQueryDto } from './dto/list-company-addresses-query.dto';
import { UpdateCompanyAddressDto } from './dto/update-company-address.dto';
import { CompanyAddressesService } from './company_addresses.service';

@ApiTags('CompanyAddresses')
@Controller('company_addresses')
export class CompanyAddressesController {
  constructor(private readonly companyAddressesService: CompanyAddressesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all company_addresses with pagination and filters' })
  list(@Query() query: ListCompanyAddressesQueryDto) {
    return this.companyAddressesService.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create company_address' })
  create(@Body() dto: CreateCompanyAddressDto) {
    return this.companyAddressesService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get company_address by id' })
  getById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.companyAddressesService.getById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update company_address by id' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateCompanyAddressDto,
  ) {
    return this.companyAddressesService.update(id, dto);
  }

  @Delete(':id/permanent')
  @ApiOperation({ summary: 'Permanently delete company_address by id' })
  permanentDelete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.companyAddressesService.permanentDelete(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete company_address by id' })
  softDelete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.companyAddressesService.softDelete(id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore soft-deleted company_address' })
  restore(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.companyAddressesService.restore(id);
  }
}
