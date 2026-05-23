import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DatatypesService } from './datatypes.service';
import { PharEnumDatatype } from './datatypes.constants';

@ApiTags('Datatypes')
@Controller('datatypes')
export class DatatypesController {
  constructor(private readonly datatypesService: DatatypesService) {}

  @Get('phar_address_type')
  @ApiOperation({ summary: 'Get phar_address_type enum values' })
  getPharAddressType() {
    return this.getBaseTypeValues('phar_address_type');
  }

  @Get('_phar_address_type')
  @ApiOperation({ summary: 'Get _phar_address_type enum values' })
  getUnderscorePharAddressType() {
    return this.getUnderscoreTypeValues('phar_address_type');
  }

  @Get('phar_company_type')
  @ApiOperation({ summary: 'Get phar_company_type enum values' })
  getPharCompanyType() {
    return this.getBaseTypeValues('phar_company_type');
  }

  @Get('_phar_company_type')
  @ApiOperation({ summary: 'Get _phar_company_type enum values' })
  getUnderscorePharCompanyType() {
    return this.getUnderscoreTypeValues('phar_company_type');
  }

  @Get('phar_discount_type')
  @ApiOperation({ summary: 'Get phar_discount_type enum values' })
  getPharDiscountType() {
    return this.getBaseTypeValues('phar_discount_type');
  }

  @Get('_phar_discount_type')
  @ApiOperation({ summary: 'Get _phar_discount_type enum values' })
  getUnderscorePharDiscountType() {
    return this.getUnderscoreTypeValues('phar_discount_type');
  }

  @Get('phar_manufacturing_status')
  @ApiOperation({ summary: 'Get phar_manufacturing_status enum values' })
  getPharManufacturingStatus() {
    return this.getBaseTypeValues('phar_manufacturing_status');
  }

  @Get('_phar_manufacturing_status')
  @ApiOperation({ summary: 'Get _phar_manufacturing_status enum values' })
  getUnderscorePharManufacturingStatus() {
    return this.getUnderscoreTypeValues('phar_manufacturing_status');
  }

  @Get('phar_order_status')
  @ApiOperation({ summary: 'Get phar_order_status enum values' })
  getPharOrderStatus() {
    return this.getBaseTypeValues('phar_order_status');
  }

  @Get('_phar_order_status')
  @ApiOperation({ summary: 'Get _phar_order_status enum values' })
  getUnderscorePharOrderStatus() {
    return this.getUnderscoreTypeValues('phar_order_status');
  }

  @Get('phar_payment_method_type')
  @ApiOperation({ summary: 'Get phar_payment_method_type enum values' })
  getPharPaymentMethodType() {
    return this.getBaseTypeValues('phar_payment_method_type');
  }

  @Get('_phar_payment_method_type')
  @ApiOperation({ summary: 'Get _phar_payment_method_type enum values' })
  getUnderscorePharPaymentMethodType() {
    return this.getUnderscoreTypeValues('phar_payment_method_type');
  }

  @Get('phar_payment_status')
  @ApiOperation({ summary: 'Get phar_payment_status enum values' })
  getPharPaymentStatus() {
    return this.getBaseTypeValues('phar_payment_status');
  }

  @Get('_phar_payment_status')
  @ApiOperation({ summary: 'Get _phar_payment_status enum values' })
  getUnderscorePharPaymentStatus() {
    return this.getUnderscoreTypeValues('phar_payment_status');
  }

  @Get('phar_prescription_status')
  @ApiOperation({ summary: 'Get phar_prescription_status enum values' })
  getPharPrescriptionStatus() {
    return this.getBaseTypeValues('phar_prescription_status');
  }

  @Get('_phar_prescription_status')
  @ApiOperation({ summary: 'Get _phar_prescription_status enum values' })
  getUnderscorePharPrescriptionStatus() {
    return this.getUnderscoreTypeValues('phar_prescription_status');
  }

  @Get('phar_product_status')
  @ApiOperation({ summary: 'Get phar_product_status enum values' })
  getPharProductStatus() {
    return this.getBaseTypeValues('phar_product_status');
  }

  @Get('_phar_product_status')
  @ApiOperation({ summary: 'Get _phar_product_status enum values' })
  getUnderscorePharProductStatus() {
    return this.getUnderscoreTypeValues('phar_product_status');
  }

  @Get('phar_purchase_order_status')
  @ApiOperation({ summary: 'Get phar_purchase_order_status enum values' })
  getPharPurchaseOrderStatus() {
    return this.getBaseTypeValues('phar_purchase_order_status');
  }

  @Get('_phar_purchase_order_status')
  @ApiOperation({ summary: 'Get _phar_purchase_order_status enum values' })
  getUnderscorePharPurchaseOrderStatus() {
    return this.getUnderscoreTypeValues('phar_purchase_order_status');
  }

  @Get('phar_receipt_status')
  @ApiOperation({ summary: 'Get phar_receipt_status enum values' })
  getPharReceiptStatus() {
    return this.getBaseTypeValues('phar_receipt_status');
  }

  @Get('_phar_receipt_status')
  @ApiOperation({ summary: 'Get _phar_receipt_status enum values' })
  getUnderscorePharReceiptStatus() {
    return this.getUnderscoreTypeValues('phar_receipt_status');
  }

  @Get('phar_return_status')
  @ApiOperation({ summary: 'Get phar_return_status enum values' })
  getPharReturnStatus() {
    return this.getBaseTypeValues('phar_return_status');
  }

  @Get('_phar_return_status')
  @ApiOperation({ summary: 'Get _phar_return_status enum values' })
  getUnderscorePharReturnStatus() {
    return this.getUnderscoreTypeValues('phar_return_status');
  }

  @Get('phar_sales_status')
  @ApiOperation({ summary: 'Get phar_sales_status enum values' })
  getPharSalesStatus() {
    return this.getBaseTypeValues('phar_sales_status');
  }

  @Get('_phar_sales_status')
  @ApiOperation({ summary: 'Get _phar_sales_status enum values' })
  getUnderscorePharSalesStatus() {
    return this.getUnderscoreTypeValues('phar_sales_status');
  }

  @Get('phar_shop_plan')
  @ApiOperation({ summary: 'Get phar_shop_plan enum values' })
  getPharShopPlan() {
    return this.getBaseTypeValues('phar_shop_plan');
  }

  @Get('_phar_shop_plan')
  @ApiOperation({ summary: 'Get _phar_shop_plan enum values' })
  getUnderscorePharShopPlan() {
    return this.getUnderscoreTypeValues('phar_shop_plan');
  }

  @Get('phar_stock_movement_type')
  @ApiOperation({ summary: 'Get phar_stock_movement_type enum values' })
  getPharStockMovementType() {
    return this.getBaseTypeValues('phar_stock_movement_type');
  }

  @Get('_phar_stock_movement_type')
  @ApiOperation({ summary: 'Get _phar_stock_movement_type enum values' })
  getUnderscorePharStockMovementType() {
    return this.getUnderscoreTypeValues('phar_stock_movement_type');
  }

  @Get('phar_user_role')
  @ApiOperation({ summary: 'Get phar_user_role enum values' })
  getPharUserRole() {
    return this.getBaseTypeValues('phar_user_role');
  }

  @Get('_phar_user_role')
  @ApiOperation({ summary: 'Get _phar_user_role enum values' })
  getUnderscorePharUserRole() {
    return this.getUnderscoreTypeValues('phar_user_role');
  }

  private getBaseTypeValues(type: PharEnumDatatype) {
    return this.datatypesService.getEnumValues(type, type);
  }

  private getUnderscoreTypeValues(type: PharEnumDatatype) {
    return this.datatypesService.getEnumValues(`_${type}`, type);
  }
}
