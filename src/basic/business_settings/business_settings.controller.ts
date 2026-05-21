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
import { CreateBusinessSettingDto } from './dto/create-business-setting.dto';
import { ListBusinessSettingsQueryDto } from './dto/list-business-settings-query.dto';
import { UpdateBusinessSettingDto } from './dto/update-business-setting.dto';
import { BusinessSettingsService } from './business_settings.service';

@ApiTags('BusinessSettings')
@Controller('business_settings')
export class BusinessSettingsController {
  constructor(private readonly businessSettingsService: BusinessSettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all business_settings with pagination and filters' })
  list(@Query() query: ListBusinessSettingsQueryDto) {
    return this.businessSettingsService.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create business_setting' })
  create(@Body() dto: CreateBusinessSettingDto) {
    return this.businessSettingsService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get business_setting by id' })
  getById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.businessSettingsService.getById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update business_setting by id' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateBusinessSettingDto,
  ) {
    return this.businessSettingsService.update(id, dto);
  }

  @Delete(':id/permanent')
  @ApiOperation({ summary: 'Permanently delete business_setting by id' })
  permanentDelete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.businessSettingsService.permanentDelete(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete business_setting by id' })
  softDelete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.businessSettingsService.softDelete(id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore soft-deleted business_setting' })
  restore(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.businessSettingsService.restore(id);
  }
}
