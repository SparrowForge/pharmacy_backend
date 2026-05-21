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
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { ListPaymentMethodsQueryDto } from './dto/list-payment-methods-query.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { PaymentMethodsService } from './payment_methods.service';

@ApiTags('PaymentMethods')
@Controller('payment_methods')
export class PaymentMethodsController {
  constructor(private readonly paymentMethodsService: PaymentMethodsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all payment_methods with pagination and filters' })
  list(@Query() query: ListPaymentMethodsQueryDto) {
    return this.paymentMethodsService.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create payment_method' })
  create(@Body() dto: CreatePaymentMethodDto) {
    return this.paymentMethodsService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment_method by id' })
  getById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.paymentMethodsService.getById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update payment_method by id' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdatePaymentMethodDto,
  ) {
    return this.paymentMethodsService.update(id, dto);
  }

  @Delete(':id/permanent')
  @ApiOperation({ summary: 'Permanently delete payment_method by id' })
  permanentDelete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.paymentMethodsService.permanentDelete(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete payment_method by id' })
  softDelete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.paymentMethodsService.softDelete(id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore soft-deleted payment_method' })
  restore(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.paymentMethodsService.restore(id);
  }
}
