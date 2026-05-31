-- =====================================================================
-- COMPLETE PHARMACY MANAGEMENT SYSTEM DATABASE SCHEMA
-- PostgreSQL
-- =====================================================================
-- Description:
-- This is a complete pharmacy management system for POS, e-commerce,
-- manufacturing, distribution, supplier management, inventory, purchase,
-- sales, and customer management.
--
-- All pharmacy-sector related parties such as suppliers, manufacturers,
-- distributors, wholesalers, retailers, pharmacies, and customers are
-- managed through a single phar_companies table. Their role is identified by
-- company_type, which makes the system flexible, scalable, and suitable
-- for all businesses related to the pharmacy sector.
-- =====================================================================

-- =====================================================================
-- EXTENSIONS
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================================
-- ENUM TYPES
-- =====================================================================

CREATE TYPE phar_company_type AS ENUM (
  'customer',
  'supplier',
  'manufacturer',
  'distributor',
  'pharmacy',
  'wholesaler',
  'retailer',
  'doctor',
  'hospital',
  'clinic',
  'other'
);

CREATE TYPE phar_user_role AS ENUM (
  'super_admin',
  'shop_admin',
  'branch_admin',
  'pharmacist',
  'inventory_manager',
  'pos_user',
  'delivery',
  'accountant',
  'staff'
);

CREATE TYPE phar_shop_plan AS ENUM (
  'starter',
  'business',
  'enterprise'
);

CREATE TYPE phar_product_status AS ENUM (
  'active',
  'inactive',
  'discontinued'
);

CREATE TYPE phar_order_status AS ENUM (
  'draft',
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'completed',
  'cancelled',
  'returned'
);

CREATE TYPE phar_purchase_order_status AS ENUM (
  'pending',
  'confirmed',
  'received',
  'partial',
  'cancelled'
);

CREATE TYPE phar_receipt_status AS ENUM (
  'draft',
  'received',
  'partial',
  'cancelled'
);

CREATE TYPE phar_return_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'completed',
  'cancelled'
);

CREATE TYPE phar_sales_status AS ENUM (
  'draft',
  'completed',
  'pending',
  'cancelled',
  'returned'
);

CREATE TYPE phar_prescription_status AS ENUM (
  'pending',
  'review',
  'processed',
  'rejected'
);

CREATE TYPE phar_payment_method_type AS ENUM (
  'cash',
  'card',
  'credit',
  'mobile',
  'bank_transfer',
  'check',
  'other'
);

CREATE TYPE phar_payment_status AS ENUM (
  'pending',
  'partial',
  'paid',
  'failed',
  'refunded',
  'cancelled'
);

CREATE TYPE phar_stock_movement_type AS ENUM (
  'opening_stock',
  'purchase_receipt',
  'sale',
  'purchase_return',
  'sales_return',
  'manufacturing_input',
  'manufacturing_output',
  'transfer_in',
  'transfer_out',
  'adjustment',
  'damage',
  'expiry'
);

CREATE TYPE phar_manufacturing_status AS ENUM (
  'planned',
  'in_progress',
  'completed',
  'cancelled'
);

CREATE TYPE phar_discount_type AS ENUM (
  'percentage',
  'fixed'
);

CREATE TYPE phar_address_type AS ENUM (
  'billing',
  'shipping',
  'office',
  'warehouse',
  'home',
  'other'
);

CREATE TYPE phar_product_unit_type AS ENUM (
  'Weight',
  'Height',
  'Volume',
  'Area',
  'Pieaces'
);

-- =====================================================================
-- LOCATION TABLES
-- =====================================================================

CREATE TABLE phar_countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) UNIQUE,
  name TEXT NOT NULL,
  is_delete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE phar_divisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id UUID NOT NULL REFERENCES phar_countries(id),
  code VARCHAR(20),
  name TEXT NOT NULL,
  is_delete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE phar_districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  division_id UUID NOT NULL REFERENCES phar_divisions(id),
  code VARCHAR(20),
  name TEXT NOT NULL,
  is_delete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE phar_thanas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id UUID NOT NULL REFERENCES phar_districts(id),
  code VARCHAR(20),
  name TEXT NOT NULL,
  postal_code VARCHAR(20),
  is_delete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE phar_regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_delete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE phar_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id UUID NOT NULL REFERENCES phar_regions(id),
  name TEXT NOT NULL,
  description TEXT,
  is_delete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE phar_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID NOT NULL REFERENCES phar_zones(id),
  name TEXT NOT NULL,
  description TEXT,
  is_delete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE phar_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES phar_routes(id),
  name TEXT NOT NULL,
  description TEXT,
  is_delete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- COMPANY / CONTACT TABLE
-- =====================================================================
-- Shared table for customer, supplier, manufacturer, distributor,
-- pharmacy, wholesaler, retailer, hospital, clinic, doctor, and others.

CREATE TABLE phar_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_type phar_company_type NOT NULL,
  name TEXT NOT NULL,
  code VARCHAR(80) UNIQUE,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  address TEXT,
  city TEXT,
  postal_code VARCHAR(30),
  country_id UUID REFERENCES phar_countries(id),
  division_id UUID REFERENCES phar_divisions(id),
  district_id UUID REFERENCES phar_districts(id),
  thana_id UUID REFERENCES phar_thanas(id),
  route_id UUID REFERENCES phar_routes(id),
  line_id UUID REFERENCES phar_lines(id),
  established_year INT,
  credit_limit NUMERIC(14,2) DEFAULT 0,
  payment_terms TEXT,
  lead_time_days INT DEFAULT 0,
  loyalty_points INT DEFAULT 0,
  total_orders INT DEFAULT 0,
  total_spent NUMERIC(16,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  is_delete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX phar_idx_companies_type ON phar_companies(company_type);
CREATE INDEX phar_idx_companies_name ON phar_companies(name);
CREATE INDEX phar_idx_companies_phone ON phar_companies(phone);
CREATE INDEX phar_idx_companies_email ON phar_companies(email);

CREATE TABLE phar_company_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES phar_companies(id) ON DELETE CASCADE,
  address_type phar_address_type NOT NULL DEFAULT 'office',
  address TEXT NOT NULL,
  city TEXT,
  postal_code VARCHAR(30),
  country_id UUID REFERENCES phar_countries(id),
  division_id UUID REFERENCES phar_divisions(id),
  district_id UUID REFERENCES phar_districts(id),
  thana_id UUID REFERENCES phar_thanas(id),
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  is_delete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE phar_company_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES phar_companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  designation TEXT,
  email TEXT,
  phone TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  is_delete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- SHOP / BRANCH TABLES
-- =====================================================================

CREATE TABLE phar_shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES phar_companies(id),
  name TEXT NOT NULL,
  owner_name TEXT,
  owner_email TEXT,
  owner_phone TEXT,
  address TEXT,
  city TEXT,
  postal_code VARCHAR(30),
  country_id UUID REFERENCES phar_countries(id),
  division_id UUID REFERENCES phar_divisions(id),
  district_id UUID REFERENCES phar_districts(id),
  thana_id UUID REFERENCES phar_thanas(id),
  plan phar_shop_plan NOT NULL DEFAULT 'starter',
  status TEXT NOT NULL DEFAULT 'active',
  route_id UUID REFERENCES phar_routes(id),
  line_id UUID REFERENCES phar_lines(id),
  branch_limit INT DEFAULT 1,
  is_delete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE phar_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES phar_shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  postal_code VARCHAR(30),
  country_id UUID REFERENCES phar_countries(id),
  division_id UUID REFERENCES phar_divisions(id),
  district_id UUID REFERENCES phar_districts(id),
  thana_id UUID REFERENCES phar_thanas(id),
  route_id UUID REFERENCES phar_routes(id),
  line_id UUID REFERENCES phar_lines(id),
  email TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  is_delete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX phar_idx_shops_company_id ON phar_shops(company_id);
CREATE INDEX phar_idx_branches_shop_id ON phar_branches(shop_id);

-- =====================================================================
-- USERS & AUTHENTICATION
-- =====================================================================

CREATE TABLE phar_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES phar_shops(id),
  branch_id UUID REFERENCES phar_branches(id),
  role phar_user_role NOT NULL DEFAULT 'staff',
  full_name VARCHAR NOT NULL,
  email VARCHAR NOT NULL UNIQUE,
  phone VARCHAR,
  password VARCHAR NOT NULL,
  status BOOLEAN NOT NULL DEFAULT TRUE,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verification_token VARCHAR,
  refresh_token_hash VARCHAR,
  refresh_token_expires_at TIMESTAMPTZ,
  password_reset_code VARCHAR(10),
  password_reset_code_expires_at TIMESTAMPTZ,
  password_reset_verified_at TIMESTAMPTZ,
  is_delete BOOLEAN NOT NULL DEFAULT FALSE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX phar_idx_users_email ON phar_users(email);
CREATE INDEX phar_idx_users_shop_id ON phar_users(shop_id);
CREATE INDEX phar_idx_users_branch_id ON phar_users(branch_id);

-- =====================================================================
-- MEDIA FILES
-- =====================================================================

CREATE TABLE phar_media_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  mime_type TEXT,
  file_size BIGINT,
  alt_text TEXT,
  uploaded_by UUID REFERENCES phar_users(id),
  is_delete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- PRODUCT CATALOG
-- =====================================================================

CREATE TABLE phar_product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES phar_product_categories(id),
  name TEXT NOT NULL UNIQUE,
  slug TEXT UNIQUE,
  description TEXT,
  icon TEXT,
  is_delete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE phar_product_brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT UNIQUE,
  description TEXT,
  manufacturer_id UUID REFERENCES phar_companies(id),
  logo_media_id UUID REFERENCES phar_media_files(id),
  is_delete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE phar_product_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  short_name VARCHAR(30) NOT NULL UNIQUE,
  description TEXT,
  unit_type phar_product_unit_type NOT NULL DEFAULT 'Pieaces',
  is_deafult_unit BOOLEAN NOT NULL DEFAULT FALSE,
  convert_rate NUMERIC(18,8),
  is_delete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE phar_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku VARCHAR(80) UNIQUE,
  barcode VARCHAR(80) UNIQUE,
  name TEXT NOT NULL,
  calling_name TEXT,
  generic_name TEXT,
  product_number VARCHAR(100),
  description TEXT,
  overview TEXT,
  tag_name TEXT,
  brand_id UUID REFERENCES phar_product_brands(id),
  category_id UUID REFERENCES phar_product_categories(id),
  unit_id UUID REFERENCES phar_product_units(id),
  default_unit_id UUID REFERENCES phar_product_units(id),
  supplier_id UUID REFERENCES phar_companies(id),
  manufacturer_id UUID REFERENCES phar_companies(id),
  distributor_id UUID REFERENCES phar_companies(id),
  purchase_price NUMERIC(14,4) DEFAULT 0,
  mrp NUMERIC(14,4) DEFAULT 0,
  selling_price NUMERIC(14,4) DEFAULT 0,
  offered_price NUMERIC(14,4),
  current_stock INT NOT NULL DEFAULT 0,
  minimum_stock INT DEFAULT 0,
  maximum_stock INT DEFAULT 0,
  reorder_level INT DEFAULT 0,
  rack_no VARCHAR(80),
  tax_rate NUMERIC(5,2) DEFAULT 0,
  shipping_cost NUMERIC(14,4) DEFAULT 0,
  weight NUMERIC(14,4),
  track_expiry_alert BOOLEAN NOT NULL DEFAULT TRUE,
  allow_warranty_claim BOOLEAN NOT NULL DEFAULT FALSE,
  allow_return BOOLEAN NOT NULL DEFAULT TRUE,
  return_period_days INT DEFAULT 30,
  bundle_offer TEXT,
  meta_title TEXT,
  meta_keyword TEXT,
  meta_description TEXT,
  preview_media_id UUID REFERENCES phar_media_files(id),
  product_video_url TEXT,
  status phar_product_status NOT NULL DEFAULT 'active',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_delete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX phar_idx_products_name ON phar_products(name);
CREATE INDEX phar_idx_products_barcode ON phar_products(barcode);
CREATE INDEX phar_idx_products_category_id ON phar_products(category_id);
CREATE INDEX phar_idx_products_supplier_id ON phar_products(supplier_id);
CREATE INDEX phar_idx_products_manufacturer_id ON phar_products(manufacturer_id);
CREATE INDEX phar_idx_products_distributor_id ON phar_products(distributor_id);

CREATE TABLE phar_product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES phar_products(id) ON DELETE CASCADE,
  media_id UUID NOT NULL REFERENCES phar_media_files(id),
  sort_order INT DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  is_delete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE phar_product_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES phar_products(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  is_delete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE phar_product_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES phar_products(id) ON DELETE CASCADE,
  badge TEXT NOT NULL,
  is_delete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE phar_product_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES phar_products(id),
  batch_number VARCHAR(100) NOT NULL,
  barcode VARCHAR(80),
  supplier_id UUID REFERENCES phar_companies(id),
  manufacturer_id UUID REFERENCES phar_companies(id),
  manufacturing_date DATE,
  expiry_date DATE,
  quantity_on_hand INT NOT NULL DEFAULT 0,
  purchase_price NUMERIC(14,4),
  selling_price NUMERIC(14,4),
  status TEXT NOT NULL DEFAULT 'available',
  location_description TEXT,
  received_date DATE,
  is_delete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(product_id, batch_number)
);

CREATE INDEX phar_idx_product_batches_product_id ON phar_product_batches(product_id);
CREATE INDEX phar_idx_product_batches_batch_number ON phar_product_batches(batch_number);
CREATE INDEX phar_idx_product_batches_expiry_date ON phar_product_batches(expiry_date);

-- =====================================================================
-- INVENTORY & STOCK
-- =====================================================================

CREATE TABLE phar_warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES phar_shops(id),
  branch_id UUID REFERENCES phar_branches(id),
  name TEXT NOT NULL,
  address TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  is_delete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE phar_stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES phar_shops(id),
  branch_id UUID REFERENCES phar_branches(id),
  warehouse_id UUID REFERENCES phar_warehouses(id),
  product_id UUID REFERENCES phar_products(id),
  product_batch_id UUID REFERENCES phar_product_batches(id),
  movement_type phar_stock_movement_type NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  quantity INT NOT NULL,
  unit_cost NUMERIC(14,4),
  notes TEXT,
  created_by UUID REFERENCES phar_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX phar_idx_stock_movements_product_id ON phar_stock_movements(product_id);
CREATE INDEX phar_idx_stock_movements_batch_id ON phar_stock_movements(product_batch_id);
CREATE INDEX phar_idx_stock_movements_created_at ON phar_stock_movements(created_at);

CREATE TABLE phar_stock_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES phar_products(id),
  product_batch_id UUID REFERENCES phar_product_batches(id),
  alert_type TEXT NOT NULL,
  alert_date DATE DEFAULT CURRENT_DATE,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE phar_stock_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_number VARCHAR(80) UNIQUE NOT NULL,
  from_branch_id UUID REFERENCES phar_branches(id),
  to_branch_id UUID REFERENCES phar_branches(id),
  from_warehouse_id UUID REFERENCES phar_warehouses(id),
  to_warehouse_id UUID REFERENCES phar_warehouses(id),
  status phar_order_status NOT NULL DEFAULT 'pending',
  created_by UUID REFERENCES phar_users(id),
  approved_by UUID REFERENCES phar_users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE phar_stock_transfer_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_transfer_id UUID NOT NULL REFERENCES phar_stock_transfers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES phar_products(id),
  product_batch_id UUID REFERENCES phar_product_batches(id),
  quantity INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- PURCHASE ORDERS & RECEIPTS
-- =====================================================================

CREATE TABLE phar_purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number VARCHAR(80) UNIQUE NOT NULL,
  supplier_id UUID NOT NULL REFERENCES phar_companies(id),
  shop_id UUID REFERENCES phar_shops(id),
  branch_id UUID REFERENCES phar_branches(id),
  status phar_purchase_order_status NOT NULL DEFAULT 'pending',
  subtotal NUMERIC(16,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(16,2) DEFAULT 0,
  tax_amount NUMERIC(16,2) DEFAULT 0,
  shipping_cost NUMERIC(16,2) DEFAULT 0,
  total_amount NUMERIC(16,2) NOT NULL DEFAULT 0,
  phar_payment_status phar_payment_status NOT NULL DEFAULT 'pending',
  expected_delivery_date DATE,
  delivery_date DATE,
  placed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES phar_users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX phar_idx_purchase_orders_supplier_id ON phar_purchase_orders(supplier_id);
CREATE INDEX phar_idx_purchase_orders_status ON phar_purchase_orders(status);

CREATE TABLE phar_purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES phar_purchase_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES phar_products(id),
  product_batch_id UUID REFERENCES phar_product_batches(id),
  purchase_unit_id UUID REFERENCES phar_product_units(id),
  quantity_purchase NUMERIC(18,6) NOT NULL DEFAULT 0,
  quantity_stock INT NOT NULL DEFAULT 0,
  quantity INT NOT NULL DEFAULT 0,
  quantity_received_purchase NUMERIC(18,6) NOT NULL DEFAULT 0,
  quantity_received_stock INT NOT NULL DEFAULT 0,
  quantity_received INT NOT NULL DEFAULT 0,
  convert_rate_used NUMERIC(18,8) NOT NULL DEFAULT 1,
  unit_cost NUMERIC(14,4) NOT NULL DEFAULT 0,
  discount NUMERIC(14,4) DEFAULT 0,
  tax NUMERIC(14,4) DEFAULT 0,
  line_total NUMERIC(16,2) NOT NULL DEFAULT 0,
  expected_expiry_date DATE,
  batch_number VARCHAR(80),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX phar_idx_purchase_order_items_po ON phar_purchase_order_items(purchase_order_id);
CREATE INDEX phar_idx_purchase_order_items_product ON phar_purchase_order_items(product_id);

CREATE TABLE phar_purchase_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number VARCHAR(80) UNIQUE NOT NULL,
  purchase_order_id UUID REFERENCES phar_purchase_orders(id),
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  received_by UUID REFERENCES phar_users(id),
  status phar_receipt_status NOT NULL DEFAULT 'received',
  total_amount NUMERIC(16,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE phar_purchase_receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_receipt_id UUID NOT NULL REFERENCES phar_purchase_receipts(id) ON DELETE CASCADE,
  purchase_order_item_id UUID REFERENCES phar_purchase_order_items(id),
  product_id UUID NOT NULL REFERENCES phar_products(id),
  product_batch_id UUID REFERENCES phar_product_batches(id),
  purchase_unit_id UUID REFERENCES phar_product_units(id),
  quantity_received_purchase NUMERIC(18,6) NOT NULL DEFAULT 0,
  quantity_received_stock INT NOT NULL DEFAULT 0,
  quantity_received INT NOT NULL DEFAULT 0,
  convert_rate_used NUMERIC(18,8) NOT NULL DEFAULT 1,
  unit_cost NUMERIC(14,4) NOT NULL DEFAULT 0,
  expiry_date DATE,
  lot_number VARCHAR(80),
  line_total NUMERIC(16,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX phar_idx_purchase_receipt_items_receipt ON phar_purchase_receipt_items(purchase_receipt_id);

CREATE TABLE phar_purchase_returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_number VARCHAR(80) UNIQUE NOT NULL,
  purchase_order_id UUID REFERENCES phar_purchase_orders(id),
  supplier_id UUID REFERENCES phar_companies(id),
  shop_id UUID REFERENCES phar_shops(id),
  branch_id UUID REFERENCES phar_branches(id),
  status phar_return_status NOT NULL DEFAULT 'pending',
  total_amount NUMERIC(16,2) NOT NULL DEFAULT 0,
  reason TEXT,
  notes TEXT,
  created_by UUID REFERENCES phar_users(id),
  processed_by UUID REFERENCES phar_users(id),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE phar_purchase_return_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_return_id UUID NOT NULL REFERENCES phar_purchase_returns(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES phar_products(id),
  product_batch_id UUID REFERENCES phar_product_batches(id),
  quantity INT NOT NULL DEFAULT 0,
  unit_cost NUMERIC(14,4) NOT NULL DEFAULT 0,
  line_total NUMERIC(16,2) NOT NULL DEFAULT 0,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX phar_idx_purchase_return_items_return ON phar_purchase_return_items(purchase_return_id);

-- =====================================================================
-- SALES / POS
-- =====================================================================

CREATE TABLE phar_sales_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(80) UNIQUE NOT NULL,
  customer_id UUID REFERENCES phar_companies(id),
  shop_id UUID REFERENCES phar_shops(id),
  branch_id UUID REFERENCES phar_branches(id),
  created_by UUID REFERENCES phar_users(id),
  status phar_sales_status NOT NULL DEFAULT 'draft',
  payment_method phar_payment_method_type NOT NULL DEFAULT 'cash',
  subtotal NUMERIC(16,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(14,2) DEFAULT 0,
  discount_amount NUMERIC(14,2) DEFAULT 0,
  total_amount NUMERIC(16,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(16,2) DEFAULT 0,
  due_amount NUMERIC(16,2) DEFAULT 0,
  change_amount NUMERIC(16,2) DEFAULT 0,
  invoice_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX phar_idx_sales_invoices_customer_id ON phar_sales_invoices(customer_id);
CREATE INDEX phar_idx_sales_invoices_invoice_date ON phar_sales_invoices(invoice_date);
CREATE INDEX phar_idx_sales_invoices_invoice_number ON phar_sales_invoices(invoice_number);

CREATE TABLE phar_sales_invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_invoice_id UUID NOT NULL REFERENCES phar_sales_invoices(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES phar_products(id),
  product_batch_id UUID REFERENCES phar_product_batches(id),
  quantity INT NOT NULL DEFAULT 0,
  unit_price NUMERIC(14,4) NOT NULL DEFAULT 0,
  discount NUMERIC(14,4) DEFAULT 0,
  tax NUMERIC(14,4) DEFAULT 0,
  line_total NUMERIC(16,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX phar_idx_sales_invoice_items_invoice ON phar_sales_invoice_items(sales_invoice_id);
CREATE INDEX phar_idx_sales_invoice_items_product ON phar_sales_invoice_items(product_id);

CREATE TABLE phar_sales_returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_number VARCHAR(80) UNIQUE NOT NULL,
  sales_invoice_id UUID REFERENCES phar_sales_invoices(id),
  customer_id UUID REFERENCES phar_companies(id),
  shop_id UUID REFERENCES phar_shops(id),
  branch_id UUID REFERENCES phar_branches(id),
  status phar_return_status NOT NULL DEFAULT 'pending',
  total_amount NUMERIC(16,2) NOT NULL DEFAULT 0,
  refund_amount NUMERIC(16,2) DEFAULT 0,
  refund_method phar_payment_method_type,
  reason TEXT,
  notes TEXT,
  created_by UUID REFERENCES phar_users(id),
  processed_by UUID REFERENCES phar_users(id),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE phar_sales_return_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_return_id UUID NOT NULL REFERENCES phar_sales_returns(id) ON DELETE CASCADE,
  sales_invoice_item_id UUID REFERENCES phar_sales_invoice_items(id),
  product_id UUID NOT NULL REFERENCES phar_products(id),
  product_batch_id UUID REFERENCES phar_product_batches(id),
  quantity INT NOT NULL DEFAULT 0,
  unit_price NUMERIC(14,4) NOT NULL DEFAULT 0,
  return_amount NUMERIC(16,2) NOT NULL DEFAULT 0,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX phar_idx_sales_return_items_return ON phar_sales_return_items(sales_return_id);

-- =====================================================================
-- E-COMMERCE
-- =====================================================================

CREATE TABLE phar_ecommerce_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES phar_companies(id),
  session_id UUID,
  shop_id UUID REFERENCES phar_shops(id),
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE phar_ecommerce_cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES phar_ecommerce_carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES phar_products(id),
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(14,4) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE phar_ecommerce_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(80) UNIQUE NOT NULL,
  customer_id UUID REFERENCES phar_companies(id),
  shop_id UUID REFERENCES phar_shops(id),
  branch_id UUID REFERENCES phar_branches(id),
  sales_invoice_id UUID REFERENCES phar_sales_invoices(id),
  status phar_order_status NOT NULL DEFAULT 'pending',
  phar_payment_status phar_payment_status NOT NULL DEFAULT 'pending',
  subtotal NUMERIC(16,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(16,2) DEFAULT 0,
  tax_amount NUMERIC(16,2) DEFAULT 0,
  shipping_cost NUMERIC(16,2) DEFAULT 0,
  total_amount NUMERIC(16,2) NOT NULL DEFAULT 0,
  shipping_address TEXT,
  billing_address TEXT,
  order_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE phar_ecommerce_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ecommerce_order_id UUID NOT NULL REFERENCES phar_ecommerce_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES phar_products(id),
  product_batch_id UUID REFERENCES phar_product_batches(id),
  quantity INT NOT NULL DEFAULT 0,
  unit_price NUMERIC(14,4) NOT NULL DEFAULT 0,
  discount NUMERIC(14,4) DEFAULT 0,
  tax NUMERIC(14,4) DEFAULT 0,
  line_total NUMERIC(16,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE phar_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_number VARCHAR(80) UNIQUE NOT NULL,
  ecommerce_order_id UUID REFERENCES phar_ecommerce_orders(id),
  sales_invoice_id UUID REFERENCES phar_sales_invoices(id),
  delivery_person_id UUID REFERENCES phar_users(id),
  customer_id UUID REFERENCES phar_companies(id),
  delivery_address TEXT NOT NULL,
  delivery_fee NUMERIC(14,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  assigned_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- MANUFACTURING
-- =====================================================================

CREATE TABLE phar_manufacturing_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  finished_product_id UUID NOT NULL REFERENCES phar_products(id),
  name TEXT NOT NULL,
  version VARCHAR(50) DEFAULT '1.0',
  expected_output_quantity NUMERIC(14,4) NOT NULL DEFAULT 1,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES phar_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE phar_manufacturing_recipe_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES phar_manufacturing_recipes(id) ON DELETE CASCADE,
  raw_product_id UUID NOT NULL REFERENCES phar_products(id),
  quantity_required NUMERIC(14,4) NOT NULL DEFAULT 0,
  wastage_percent NUMERIC(5,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE phar_manufacturing_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mo_number VARCHAR(80) UNIQUE NOT NULL,
  manufacturer_id UUID REFERENCES phar_companies(id),
  shop_id UUID REFERENCES phar_shops(id),
  branch_id UUID REFERENCES phar_branches(id),
  recipe_id UUID REFERENCES phar_manufacturing_recipes(id),
  finished_product_id UUID NOT NULL REFERENCES phar_products(id),
  planned_quantity NUMERIC(14,4) NOT NULL DEFAULT 0,
  produced_quantity NUMERIC(14,4) DEFAULT 0,
  status phar_manufacturing_status NOT NULL DEFAULT 'planned',
  start_date DATE,
  end_date DATE,
  created_by UUID REFERENCES phar_users(id),
  approved_by UUID REFERENCES phar_users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE phar_manufacturing_order_inputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manufacturing_order_id UUID NOT NULL REFERENCES phar_manufacturing_orders(id) ON DELETE CASCADE,
  raw_product_id UUID NOT NULL REFERENCES phar_products(id),
  product_batch_id UUID REFERENCES phar_product_batches(id),
  quantity_used NUMERIC(14,4) NOT NULL DEFAULT 0,
  unit_cost NUMERIC(14,4) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE phar_manufacturing_order_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manufacturing_order_id UUID NOT NULL REFERENCES phar_manufacturing_orders(id) ON DELETE CASCADE,
  finished_product_id UUID NOT NULL REFERENCES phar_products(id),
  product_batch_id UUID REFERENCES phar_product_batches(id),
  quantity_produced NUMERIC(14,4) NOT NULL DEFAULT 0,
  batch_number VARCHAR(100),
  manufacturing_date DATE,
  expiry_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- PRESCRIPTIONS
-- =====================================================================

CREATE TABLE phar_prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_number VARCHAR(80) UNIQUE NOT NULL,
  customer_id UUID REFERENCES phar_companies(id),
  patient_name TEXT NOT NULL,
  patient_phone TEXT,
  doctor_company_id UUID REFERENCES phar_companies(id),
  doctor_name TEXT,
  shop_id UUID REFERENCES phar_shops(id),
  branch_id UUID REFERENCES phar_branches(id),
  uploaded_by UUID REFERENCES phar_users(id),
  status phar_prescription_status NOT NULL DEFAULT 'pending',
  ai_confidence NUMERIC(5,2),
  ocr_text TEXT,
  file_media_id UUID REFERENCES phar_media_files(id),
  notes TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE phar_prescription_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID NOT NULL REFERENCES phar_prescriptions(id) ON DELETE CASCADE,
  product_id UUID REFERENCES phar_products(id),
  medicine_name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT,
  duration TEXT,
  quantity INT,
  instructions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX phar_idx_prescription_items_prescription ON phar_prescription_items(prescription_id);

-- =====================================================================
-- PAYMENTS & ACCOUNTS
-- =====================================================================

CREATE TABLE phar_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  method_type phar_payment_method_type NOT NULL DEFAULT 'cash',
  description TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_delete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE phar_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_number VARCHAR(80) UNIQUE NOT NULL,
  company_id UUID REFERENCES phar_companies(id),
  shop_id UUID REFERENCES phar_shops(id),
  branch_id UUID REFERENCES phar_branches(id),
  reference_type TEXT,
  reference_id UUID,
  payment_method_id UUID REFERENCES phar_payment_methods(id),
  amount NUMERIC(16,2) NOT NULL DEFAULT 0,
  status phar_payment_status NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  received_by UUID REFERENCES phar_users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE phar_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_number VARCHAR(80) UNIQUE NOT NULL,
  shop_id UUID REFERENCES phar_shops(id),
  branch_id UUID REFERENCES phar_branches(id),
  expense_category TEXT NOT NULL,
  amount NUMERIC(16,2) NOT NULL DEFAULT 0,
  payment_method_id UUID REFERENCES phar_payment_methods(id),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  paid_to TEXT,
  created_by UUID REFERENCES phar_users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- DISCOUNTS, OFFERS & COUPONS
-- =====================================================================

CREATE TABLE phar_discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(80) UNIQUE NOT NULL,
  description TEXT,
  phar_discount_type phar_discount_type NOT NULL DEFAULT 'percentage',
  discount_value NUMERIC(14,2) NOT NULL,
  max_usage INT,
  usage_count INT DEFAULT 0,
  min_purchase_amount NUMERIC(16,2),
  valid_from DATE,
  valid_until DATE,
  is_active BOOLEAN DEFAULT TRUE,
  is_delete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE phar_product_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES phar_products(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  phar_discount_type phar_discount_type NOT NULL DEFAULT 'percentage',
  discount_value NUMERIC(14,2) NOT NULL DEFAULT 0,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  is_delete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- REVIEWS & CUSTOMER ENGAGEMENT
-- =====================================================================

CREATE TABLE phar_product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES phar_products(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES phar_companies(id),
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE phar_customer_loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES phar_companies(id),
  reference_type TEXT,
  reference_id UUID,
  points INT NOT NULL DEFAULT 0,
  transaction_type TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- SETTINGS & AUDIT LOGS
-- =====================================================================

CREATE TABLE phar_business_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES phar_shops(id),
  setting_key VARCHAR(100) NOT NULL,
  setting_value TEXT,
  description TEXT,
  data_type VARCHAR(50),
  is_delete BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(shop_id, setting_key)
);

CREATE TABLE phar_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES phar_users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX phar_idx_audit_logs_user_id ON phar_audit_logs(user_id);
CREATE INDEX phar_idx_audit_logs_created_at ON phar_audit_logs(created_at);

-- =====================================================================
-- HELPER FUNCTION FOR UPDATED_AT
-- =====================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- UPDATED_AT TRIGGERS
-- =====================================================================

CREATE TRIGGER trg_companies_updated_at BEFORE UPDATE ON phar_companies FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_shops_updated_at BEFORE UPDATE ON phar_shops FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_branches_updated_at BEFORE UPDATE ON phar_branches FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON phar_users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON phar_products FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_product_batches_updated_at BEFORE UPDATE ON phar_product_batches FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_purchase_orders_updated_at BEFORE UPDATE ON phar_purchase_orders FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_sales_invoices_updated_at BEFORE UPDATE ON phar_sales_invoices FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_ecommerce_orders_updated_at BEFORE UPDATE ON phar_ecommerce_orders FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_manufacturing_orders_updated_at BEFORE UPDATE ON phar_manufacturing_orders FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =====================================================================
-- VIEWS
-- =====================================================================

CREATE VIEW phar_stock_overview AS
SELECT
  p.id AS product_id,
  p.name AS product_name,
  p.barcode,
  pc.name AS category_name,
  p.current_stock,
  p.minimum_stock,
  p.maximum_stock,
  p.reorder_level,
  p.rack_no,
  CASE
    WHEN p.current_stock <= p.minimum_stock THEN 'low_stock'
    WHEN p.maximum_stock > 0 AND p.current_stock >= p.maximum_stock THEN 'overstocked'
    ELSE 'normal'
  END AS stock_status
FROM phar_products p
LEFT JOIN phar_product_categories pc ON p.category_id = pc.id
WHERE p.is_active = TRUE;

CREATE VIEW phar_daily_sales_summary AS
SELECT
  DATE(si.invoice_date) AS sale_date,
  COUNT(DISTINCT si.id) AS total_invoices,
  SUM(si.total_amount) AS total_sales,
  COUNT(DISTINCT si.customer_id) AS unique_customers,
  AVG(si.total_amount) AS avg_invoice_value
FROM phar_sales_invoices si
WHERE si.status = 'completed'
GROUP BY DATE(si.invoice_date);

CREATE VIEW phar_top_selling_products AS
SELECT
  p.id AS product_id,
  p.name AS product_name,
  COUNT(sii.id) AS total_sold_lines,
  SUM(sii.quantity) AS units_sold,
  SUM(sii.line_total) AS revenue,
  AVG(sii.unit_price) AS avg_price
FROM phar_sales_invoice_items sii
JOIN phar_products p ON sii.product_id = p.id
GROUP BY p.id, p.name
ORDER BY units_sold DESC;

CREATE VIEW phar_pending_purchase_orders AS
SELECT
  po.id AS purchase_order_id,
  po.po_number,
  c.name AS supplier_name,
  po.total_amount,
  po.expected_delivery_date,
  po.status,
  COUNT(poi.id) AS item_count
FROM phar_purchase_orders po
JOIN phar_companies c ON po.supplier_id = c.id
LEFT JOIN phar_purchase_order_items poi ON po.id = poi.purchase_order_id
WHERE po.status IN ('pending', 'confirmed', 'partial')
GROUP BY po.id, po.po_number, c.name, po.total_amount, po.expected_delivery_date, po.status;

CREATE VIEW phar_company_type_summary AS
SELECT
  company_type,
  COUNT(*) AS total_companies
FROM phar_companies
GROUP BY company_type;

-- =====================================================================
-- DEFAULT SEED DATA
-- =====================================================================

INSERT INTO phar_product_units (name, short_name, description, unit_type) VALUES
('Piece', 'pcs', 'Single piece', 'Pieaces'),
('Strip', 'strip', 'Medicine strip', 'Pieaces'),
('Box', 'box', 'Box package', 'Pieaces'),
('Bottle', 'bottle', 'Bottle package', 'Pieaces'),
('Tube', 'tube', 'Tube package', 'Pieaces'),
('Packet', 'packet', 'Packet package', 'Pieaces')
ON CONFLICT (name) DO NOTHING;

INSERT INTO phar_payment_methods (name, method_type, description) VALUES
('Cash', 'cash', 'Cash payment'),
('Card', 'card', 'Debit or credit card payment'),
('Mobile Banking', 'mobile', 'Mobile financial service payment'),
('Bank Transfer', 'bank_transfer', 'Bank transfer payment'),
('Credit', 'credit', 'Credit sale or due payment'),
('Check', 'check', 'Check payment')
ON CONFLICT (name) DO NOTHING;

-- =====================================================================
-- END OF FILE
-- =====================================================================
