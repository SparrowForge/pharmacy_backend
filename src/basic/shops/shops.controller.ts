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
import { CreateShopDto } from './dto/create-shop.dto';
import { ListShopsQueryDto } from './dto/list-shops-query.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { ShopsService } from './shops.service';

@ApiTags('Shops')
@Controller('shops')
export class ShopsController {
  constructor(private readonly shopsService: ShopsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all shops with pagination and filters' })
  list(@Query() query: ListShopsQueryDto) {
    return this.shopsService.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create shop' })
  create(@Body() dto: CreateShopDto) {
    return this.shopsService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get shop by id' })
  getById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.shopsService.getById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update shop by id' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateShopDto,
  ) {
    return this.shopsService.update(id, dto);
  }

  @Delete(':id/permanent')
  @ApiOperation({ summary: 'Permanently delete shop by id' })
  permanentDelete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.shopsService.permanentDelete(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete shop by id' })
  softDelete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.shopsService.softDelete(id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore soft-deleted shop' })
  restore(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.shopsService.restore(id);
  }
}
