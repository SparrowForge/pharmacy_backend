import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../auth/decorators/public.decorator';
import { CreateBranchDto } from './dto/create-branch.dto';
import { ListBranchesQueryDto } from './dto/list-branches-query.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { BranchesService } from './branches.service';

@ApiTags('Branches')
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all branches with pagination and filters' })
  list(@Query() query: ListBranchesQueryDto) {
    return this.branchesService.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create branch' })
  create(@Body() dto: CreateBranchDto) {
    return this.branchesService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get branch by id' })
  getById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.branchesService.getById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update branch by id' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateBranchDto,
  ) {
    return this.branchesService.update(id, dto);
  }

  @Delete(':id/permanent')
  @ApiOperation({ summary: 'Permanently delete branch by id' })
  permanentDelete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.branchesService.permanentDelete(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete branch by id' })
  softDelete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.branchesService.softDelete(id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore soft-deleted branch' })
  restore(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.branchesService.restore(id);
  }
}
