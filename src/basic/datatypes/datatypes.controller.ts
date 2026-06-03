import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../auth/decorators/public.decorator';
import { DatatypesService } from './datatypes.service';
import { PharEnumDatatype } from './datatypes.constants';

@ApiTags('Datatypes')
@Controller('datatypes')
export class DatatypesController {
  constructor(private readonly datatypesService: DatatypesService) {}

  @Get('address_type')
  @ApiOperation({ summary: 'Get phar_address_type enum values' })
  getPharAddressType() {
    return this.getBaseTypeValues('phar_address_type');
  }

  @Get('company_type')
  @ApiOperation({ summary: 'Get phar_company_type enum values' })
  getPharCompanyType() {
    return this.getBaseTypeValues('phar_company_type');
  }

  @Get('discount_type')
  @ApiOperation({ summary: 'Get phar_discount_type enum values' })
  getPharDiscountType() {
    return this.getBaseTypeValues('phar_discount_type');
  }

  @Get('manufacturing_status')
  @ApiOperation({ summary: 'Get phar_manufacturing_status enum values' })
  getPharManufacturingStatus() {
    return this.getBaseTypeValues('phar_manufacturing_status');
  }

  @Get('order_status')
  @ApiOperation({ summary: 'Get phar_order_status enum values' })
  getPharOrderStatus() {
    return this.getBaseTypeValues('phar_order_status');
  }

  @Get('payment_method_type')
  @ApiOperation({ summary: 'Get phar_payment_method_type enum values' })
  getPharPaymentMethodType() {
    return this.getBaseTypeValues('phar_payment_method_type');
  }

  @Get('payment_status')
  @ApiOperation({ summary: 'Get phar_payment_status enum values' })
  getPharPaymentStatus() {
    return this.getBaseTypeValues('phar_payment_status');
  }

  @Get('prescription_status')
  @ApiOperation({ summary: 'Get phar_prescription_status enum values' })
  getPharPrescriptionStatus() {
    return this.getBaseTypeValues('phar_prescription_status');
  }

  @Get('product_status')
  @ApiOperation({ summary: 'Get phar_product_status enum values' })
  getPharProductStatus() {
    return this.getBaseTypeValues('phar_product_status');
  }

  @Get('product_unit_type')
  @ApiOperation({ summary: 'Get phar_product_unit_type enum values' })
  getPharProductUnitType() {
    return this.getBaseTypeValues('phar_product_unit_type');
  }

  @Get('purchase_order_status')
  @ApiOperation({ summary: 'Get phar_purchase_order_status enum values' })
  getPharPurchaseOrderStatus() {
    return this.getBaseTypeValues('phar_purchase_order_status');
  }

  @Get('receipt_status')
  @ApiOperation({ summary: 'Get phar_receipt_status enum values' })
  getPharReceiptStatus() {
    return this.getBaseTypeValues('phar_receipt_status');
  }

  @Get('return_status')
  @ApiOperation({ summary: 'Get phar_return_status enum values' })
  getPharReturnStatus() {
    return this.getBaseTypeValues('phar_return_status');
  }

  @Get('sales_status')
  @ApiOperation({ summary: 'Get phar_sales_status enum values' })
  getPharSalesStatus() {
    return this.getBaseTypeValues('phar_sales_status');
  }

  @Get('shop_plan')
  @ApiOperation({ summary: 'Get phar_shop_plan enum values' })
  getPharShopPlan() {
    return this.getBaseTypeValues('phar_shop_plan');
  }

  @Get('stock_movement_type')
  @ApiOperation({ summary: 'Get phar_stock_movement_type enum values' })
  getPharStockMovementType() {
    return this.getBaseTypeValues('phar_stock_movement_type');
  }

  @Get('user_role')
  @Public()
  @ApiOperation({ summary: 'Get phar_user_role enum values' })
  getPharUserRole() {
    return this.getBaseTypeValues('phar_user_role');
  }

  private getBaseTypeValues(type: PharEnumDatatype) {
    return this.datatypesService.getEnumValues(type, type);
  }
}
