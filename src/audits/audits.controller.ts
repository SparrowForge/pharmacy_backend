import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuditsService } from './audits.service';
import { CleanupAuditsDto } from './dto/cleanup-audits.dto';
import { ListAuditsQueryDto } from './dto/list-audits-query.dto';

@ApiTags('Audit Logs')
@Controller('audits')
export class AuditsController {
  constructor(private readonly auditsService: AuditsService) {}

  @Get()
  @ApiOperation({ summary: 'Get audit logs' })
  getAuditLogs(@Query() query: ListAuditsQueryDto) {
    return this.auditsService.getAudits(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get audit statistics' })
  getAuditStats() {
    return this.auditsService.getAuditStats();
  }

  @Get('resource/:resource')
  @ApiOperation({ summary: 'Get audit logs by resource' })
  getByResource(
    @Param('resource') resource: string,
    @Query() query: ListAuditsQueryDto,
  ) {
    return this.auditsService.getAuditsByResource(resource, query.page, query.limit);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get audit logs by user' })
  getByUser(
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Query() query: ListAuditsQueryDto,
  ) {
    return this.auditsService.getAuditsByUser(userId, query.page, query.limit);
  }

  @Post('cleanup')
  @ApiOperation({ summary: 'Clean up old audit logs' })
  cleanup(@Body() body: CleanupAuditsDto) {
    return this.auditsService.cleanupOldAudits(body.olderThanDays);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get audit log by ID' })
  getById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.auditsService.getAuditById(id);
  }
}
