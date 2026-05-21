import { Module } from '@nestjs/common';
import { BasicCrudModule } from '../common/basic-crud.module';
import { BranchesController } from './branches.controller';
import { BranchesService } from './branches.service';

@Module({
  imports: [BasicCrudModule],
  controllers: [BranchesController],
  providers: [BranchesService],
})
export class BranchesModule {}
