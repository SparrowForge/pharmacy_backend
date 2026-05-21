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
import { CreateDiscountCodeDto } from './dto/create-discount-code.dto';
import { ListDiscountCodesQueryDto } from './dto/list-discount-codes-query.dto';
import { UpdateDiscountCodeDto } from './dto/update-discount-code.dto';
import { DiscountCodesService } from './discount_codes.service';

@ApiTags('DiscountCodes')
@Controller('discount_codes')
export class DiscountCodesController {
  constructor(private readonly discountCodesService: DiscountCodesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all discount_codes with pagination and filters' })
  list(@Query() query: ListDiscountCodesQueryDto) {
    return this.discountCodesService.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create discount_code' })
  create(@Body() dto: CreateDiscountCodeDto) {
    return this.discountCodesService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get discount_code by id' })
  getById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.discountCodesService.getById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update discount_code by id' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateDiscountCodeDto,
  ) {
    return this.discountCodesService.update(id, dto);
  }

  @Delete(':id/permanent')
  @ApiOperation({ summary: 'Permanently delete discount_code by id' })
  permanentDelete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.discountCodesService.permanentDelete(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete discount_code by id' })
  softDelete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.discountCodesService.softDelete(id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore soft-deleted discount_code' })
  restore(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.discountCodesService.restore(id);
  }
}
