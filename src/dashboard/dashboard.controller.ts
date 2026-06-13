import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import {
  DashboardExpiryQueryDto,
  DashboardPageQueryDto,
  DashboardSummaryQueryDto,
} from './dto/dashboard-query.dto';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({
    summary: "Dashboard summary: today's sales amount, total orders, low stock count, expiring soon count",
  })
  getSummary(@Query() query: DashboardSummaryQueryDto) {
    return this.dashboardService.getSummary(query.expiry_days ?? 30);
  }

  @Get('today-sales')
  @ApiOperation({ summary: "Paginated list of today's completed sales invoices" })
  getTodaySales(@Query() query: DashboardPageQueryDto) {
    return this.dashboardService.getTodaySalesDetails(query.page ?? 1, query.limit ?? 20);
  }

  @Get('total-orders')
  @ApiOperation({ summary: "Paginated list of today's orders (all non-cancelled statuses)" })
  getTotalOrders(@Query() query: DashboardPageQueryDto) {
    return this.dashboardService.getTotalOrdersDetails(query.page ?? 1, query.limit ?? 20);
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Paginated list of products at or below minimum stock level' })
  getLowStock(@Query() query: DashboardPageQueryDto) {
    return this.dashboardService.getLowStockDetails(query.page ?? 1, query.limit ?? 20);
  }

  @Get('expiring-soon')
  @ApiOperation({ summary: 'Paginated list of product batches expiring within N days (default 30)' })
  getExpiringSoon(@Query() query: DashboardExpiryQueryDto) {
    return this.dashboardService.getExpiringSoonDetails(
      query.days ?? 30,
      query.page ?? 1,
      query.limit ?? 20,
    );
  }
}
