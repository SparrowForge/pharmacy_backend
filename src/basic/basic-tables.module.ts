import { Module } from '@nestjs/common';
import { BranchesModule } from './branches/branches.module';
import { BusinessSettingsModule } from './business_settings/business_settings.module';
import { CompaniesModule } from './companies/companies.module';
import { CompanyAddressesModule } from './company_addresses/company_addresses.module';
import { CompanyContactsModule } from './company_contacts/company_contacts.module';
import { CountriesModule } from './countries/countries.module';
import { DiscountCodesModule } from './discount_codes/discount_codes.module';
import { DistrictsModule } from './districts/districts.module';
import { DivisionsModule } from './divisions/divisions.module';
import { LinesModule } from './lines/lines.module';
import { MediaFilesModule } from './media_files/media_files.module';
import { PaymentMethodsModule } from './payment_methods/payment_methods.module';
import { ProductBadgesModule } from './product_badges/product_badges.module';
import { ProductBatchesModule } from './product_batches/product_batches.module';
import { ProductBrandsModule } from './product_brands/product_brands.module';
import { ProductCategoriesModule } from './product_categories/product_categories.module';
import { ProductImagesModule } from './product_images/product_images.module';
import { ProductOffersModule } from './product_offers/product_offers.module';
import { ProductsModule } from './products/products.module';
import { ProductTagsModule } from './product_tags/product_tags.module';
import { ProductUnitsModule } from './product_units/product_units.module';
import { RegionsModule } from './regions/regions.module';
import { RoutesModule } from './routes/routes.module';
import { ShopsModule } from './shops/shops.module';
import { ThanasModule } from './thanas/thanas.module';
import { WarehousesModule } from './warehouses/warehouses.module';
import { ZonesModule } from './zones/zones.module';

@Module({
  imports: [BranchesModule, BusinessSettingsModule, CompaniesModule, CompanyAddressesModule, CompanyContactsModule, CountriesModule, DiscountCodesModule, DistrictsModule, DivisionsModule, LinesModule, MediaFilesModule, PaymentMethodsModule, ProductBadgesModule, ProductBatchesModule, ProductBrandsModule, ProductCategoriesModule, ProductImagesModule, ProductOffersModule, ProductsModule, ProductTagsModule, ProductUnitsModule, RegionsModule, RoutesModule, ShopsModule, ThanasModule, WarehousesModule, ZonesModule],
})
export class BasicTablesModule {}
