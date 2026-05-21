import { PartialType } from '@nestjs/swagger';
import { CreateThanaDto } from './create-thana.dto';

export class UpdateThanaDto extends PartialType(CreateThanaDto) {}
