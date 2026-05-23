import { Module } from '@nestjs/common';
import { DatatypesController } from './datatypes.controller';
import { DatatypesService } from './datatypes.service';

@Module({
  controllers: [DatatypesController],
  providers: [DatatypesService],
})
export class DatatypesModule {}
