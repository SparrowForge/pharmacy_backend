export const USER_ROLES = [
  'super_admin',
  'shop_admin',
  'branch_admin',
  'pharmacist',
  'inventory_manager',
  'pos_user',
  'delivery',
  'accountant',
  'staff',
] as const;

export type UserRole = (typeof USER_ROLES)[number];
