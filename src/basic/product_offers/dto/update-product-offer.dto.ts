import { PartialType } from '@nestjs/swagger';
import { CreateProductOfferDto } from './create-product-offer.dto';

export class UpdateProductOfferDto extends PartialType(CreateProductOfferDto) {}
