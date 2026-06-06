export const PHAR_ENUM_DATATYPES = [
  'phar_address_type',
  'phar_company_type',
  'phar_discount_type',
  'phar_manufacturing_status',
  'phar_order_status',
  'phar_payment_method_type',
  'phar_payment_status',
  'phar_prescription_status',
  'phar_product_status',
  'phar_product_unit_type',
  'phar_purchase_order_status',
  'phar_receipt_status',
  'phar_return_status',
  'phar_sale_type',
  'phar_sales_status',
  'phar_shop_plan',
  'phar_stock_movement_type',
  'phar_user_role',
] as const;

export type PharEnumDatatype = (typeof PHAR_ENUM_DATATYPES)[number];
