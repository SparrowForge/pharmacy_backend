import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { StockReportQueryDto } from './dto/stock-report-query.dto';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('stock')
  @ApiOperation({
    summary:
      'Stock report (opening, receive, purchase return, sales, closing) over a date range, optionally filtered by category and product',
  })
  stock(@Query() query: StockReportQueryDto) {
    return this.reportsService.stockReport(query);
  }
}
