import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  limit!: number;

  @ApiProperty({ example: 1 })
  totalPages!: number;

  @ApiProperty({ example: false })
  hasNextPage!: boolean;

  @ApiProperty({ example: false })
  hasPreviousPage!: boolean;
}

export class PaginatedResponseDto<TItem = unknown> {
  items!: TItem[];
  meta!: PaginationMetaDto;
}

export class BaseResponseDto<TData = unknown> {
  success!: boolean;
  message!: string;
  data!: TData;
  timestamp!: string;
}

export class UserListItemDto {
  @ApiProperty({ example: '8af4de2b-0ea5-4df4-b925-15ed8bbaf7f8' })
  id!: string;

  @ApiProperty({ example: '7b5c862e-a7ab-4d3c-a912-f8c18fd7026f', nullable: true })
  shopId!: string | null;

  @ApiProperty({ example: 'f9f56b89-c8a2-47f1-b774-774f939d6058', nullable: true })
  branchId!: string | null;

  @ApiProperty({ example: 'admin' })
  role!: string;

  @ApiProperty({ example: 'Super User' })
  fullName!: string;

  @ApiProperty({ example: 'admin@blueatlantic.com' })
  email!: string;

  @ApiProperty({ example: '+1234567890', nullable: true })
  phone!: string | null;

  @ApiProperty({ example: true })
  status!: boolean;

  @ApiProperty({ example: false })
  isDelete!: boolean;

  @ApiProperty({ example: true })
  isVerified!: boolean;

  @ApiProperty({ example: '2024-03-14T12:00:00.000Z', nullable: true })
  lastLoginAt!: string | null;

  @ApiProperty({ example: '2024-03-14T12:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2024-03-14T12:00:00.000Z' })
  updatedAt!: string;
}

export class PaginatedUsersResponseDto extends PaginatedResponseDto<UserListItemDto> {
  @ApiProperty({ type: [UserListItemDto] })
  declare items: UserListItemDto[];

  @ApiProperty({ type: PaginationMetaDto })
  declare meta: PaginationMetaDto;
}

export class ListUsersResponseDto extends BaseResponseDto<PaginatedUsersResponseDto> {
  @ApiProperty({ example: true })
  declare success: boolean;

  @ApiProperty({ example: 'Users retrieved successfully' })
  declare message: string;

  @ApiProperty({ type: PaginatedUsersResponseDto })
  declare data: PaginatedUsersResponseDto;

  @ApiProperty({ example: '2024-03-14T12:00:00.000Z' })
  declare timestamp: string;
}
