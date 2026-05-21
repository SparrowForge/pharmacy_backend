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
import { CreateRouteDto } from './dto/create-route.dto';
import { ListRoutesQueryDto } from './dto/list-routes-query.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { RoutesService } from './routes.service';

@ApiTags('Routes')
@Controller('routes')
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all routes with pagination and filters' })
  list(@Query() query: ListRoutesQueryDto) {
    return this.routesService.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create route' })
  create(@Body() dto: CreateRouteDto) {
    return this.routesService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get route by id' })
  getById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.routesService.getById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update route by id' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateRouteDto,
  ) {
    return this.routesService.update(id, dto);
  }

  @Delete(':id/permanent')
  @ApiOperation({ summary: 'Permanently delete route by id' })
  permanentDelete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.routesService.permanentDelete(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete route by id' })
  softDelete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.routesService.softDelete(id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore soft-deleted route' })
  restore(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.routesService.restore(id);
  }
}
