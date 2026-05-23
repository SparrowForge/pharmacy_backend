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
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { ListUsersResponseDto } from './dto/list-users-response.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all users with pagination and filters',
    description:
      'Retrieves a paginated list of all active users with optional filtering by role, department, and search terms. Requires authentication.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of users',
    type: ListUsersResponseDto,
    schema: {
      example: {
        success: true,
        message: 'Users retrieved successfully',
        data: {
          items: [
            {
              id: '8af4de2b-0ea5-4df4-b925-15ed8bbaf7f8',
              shopId: '7b5c862e-a7ab-4d3c-a912-f8c18fd7026f',
              branchId: 'f9f56b89-c8a2-47f1-b774-774f939d6058',
              role: 'admin',
              fullName: 'Admin',
              email: 'najmuzzaman@sprwforge.com',
              phone: '+1234567890',
              status: true,
              isDelete: false,
              isVerified: true,
              lastLoginAt: '2024-03-14T12:00:00.000Z',
              createdAt: '2024-03-14T12:00:00.000Z',
              updatedAt: '2024-03-14T12:00:00.000Z',
            },
          ],
          meta: {
            total: 1,
            page: 1,
            limit: 10,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        },
        timestamp: '2024-03-14T12:00:00.000Z',
      },
    },
  })
  getUsers(@Query() query: ListUsersQueryDto): Promise<ListUsersResponseDto> {
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
