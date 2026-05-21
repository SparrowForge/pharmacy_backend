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
import { CreateCountryDto } from './dto/create-country.dto';
import { ListCountriesQueryDto } from './dto/list-countries-query.dto';
import { UpdateCountryDto } from './dto/update-country.dto';
import { CountriesService } from './countries.service';

@ApiTags('Countries')
@Controller('countries')
export class CountriesController {
  constructor(private readonly countriesService: CountriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all countries with pagination and filters' })
  list(@Query() query: ListCountriesQueryDto) {
    return this.countriesService.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create country' })
  create(@Body() dto: CreateCountryDto) {
    return this.countriesService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get country by id' })
  getById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.countriesService.getById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update country by id' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateCountryDto,
  ) {
    return this.countriesService.update(id, dto);
  }

  @Delete(':id/permanent')
  @ApiOperation({ summary: 'Permanently delete country by id' })
  permanentDelete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.countriesService.permanentDelete(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete country by id' })
  softDelete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.countriesService.softDelete(id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore soft-deleted country' })
  restore(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.countriesService.restore(id);
  }
}
