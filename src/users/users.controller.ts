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
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  createUser(@Body() dto: CreateUserDto) {
    return this.usersService.createUser(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users with pagination and filters' })
  getUsers(@Query() query: ListUsersQueryDto) {
    return this.usersService.getUsers(query);
  }

  @Post('update-password')
  @ApiOperation({ summary: 'Update password' })
  updatePassword(@Body() dto: UpdatePasswordDto) {
    return this.usersService.updatePassword(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by id' })
  getUserById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.usersService.getUserById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user by id' })
  updateUserById(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.updateUserById(id, dto);
  }

  @Delete(':id/permanent')
  @ApiOperation({ summary: 'Permanently delete a user by id' })
  permanentDeleteUser(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.usersService.permanentDeleteUserById(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a user by id' })
  softDeleteUser(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.usersService.softDeleteUserById(id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted user' })
  restoreSoftDeletedUser(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.usersService.restoreSoftDeletedUser(id);
  }
}
