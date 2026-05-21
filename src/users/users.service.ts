import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { compare, hash } from 'bcryptjs';
import { QueryResultRow } from 'pg';
import { DatabaseService } from '../database/database.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';

type UserRow = QueryResultRow & {
  id: string;
  shop_id: string | null;
  branch_id: string | null;
  role: string;
  full_name: string;
  email: string;
  phone: string | null;
  password: string;
  status: boolean;
  is_verified: boolean;
  verification_token: string | null;
  refresh_token_hash: string | null;
  refresh_token_expires_at: string | null;
  password_reset_code: string | null;
  password_reset_code_expires_at: string | null;
  password_reset_verified_at: string | null;
  is_delete: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
};

@Injectable()
export class UsersService {
  constructor(private readonly databaseService: DatabaseService) {}

  async createUser(dto: CreateUserDto) {
    const email = this.normalizeEmail(dto.email);
    await this.ensureEmailNotUsed(email);

    const passwordHash = await hash(dto.password, 12);

    const result = await this.databaseService.query<UserRow>(
      `
      INSERT INTO phar_users (
        shop_id, branch_id, role, full_name, email, phone, password, status, is_verified
      )
      VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
      `,
      [
        dto.shopId ?? null,
        dto.branchId ?? null,
        dto.role ?? 'staff',
        dto.fullName,
        email,
        dto.phone ?? null,
        passwordHash,
        dto.status ?? true,
        dto.isVerified ?? false,
      ],
    );

    return this.mapUser(result.rows[0]);
  }

  async getUsers(query: ListUsersQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    const filters: string[] = ['is_delete = FALSE'];
    const params: unknown[] = [];

    if (query.search) {
      params.push(`%${query.search.trim()}%`);
      filters.push(
        `(full_name ILIKE $${params.length} OR email ILIKE $${params.length} OR phone ILIKE $${params.length})`,
      );
    }

    if (query.role) {
      params.push(query.role);
      filters.push(`role = $${params.length}`);
    }

    if (query.status !== undefined) {
      params.push(query.status === 'true');
      filters.push(`status = $${params.length}::boolean`);
    }

    if (query.isVerified !== undefined) {
      params.push(query.isVerified === 'true');
      filters.push(`is_verified = $${params.length}::boolean`);
    }

    if (query.shopId) {
      params.push(query.shopId);
      filters.push(`shop_id = $${params.length}::uuid`);
    }

    if (query.branchId) {
      params.push(query.branchId);
      filters.push(`branch_id = $${params.length}::uuid`);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const countResult = await this.databaseService.query<{ total: number }>(
      `
      SELECT COUNT(*)::int AS total
      FROM phar_users
      ${whereClause}
      `,
      params,
    );

    const usersResult = await this.databaseService.query<UserRow>(
      `
      SELECT *
      FROM phar_users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
      `,
      [...params, limit, offset],
    );

    return {
      page,
      limit,
      total: countResult.rows[0]?.total ?? 0,
      data: usersResult.rows.map((row) => this.mapUser(row)),
    };
  }

  async getUserById(id: string) {
    const user = await this.findUserByIdOrThrow(id);
    return this.mapUser(user);
  }

  async updateUserById(id: string, dto: UpdateUserDto) {
    const existingUser = await this.findUserByIdOrThrow(id);

    let nextEmail = existingUser.email;
    if (dto.email) {
      nextEmail = this.normalizeEmail(dto.email);
      if (nextEmail !== existingUser.email.toLowerCase()) {
        await this.ensureEmailNotUsed(nextEmail, id);
      }
    }

    const nextPassword = dto.password
      ? await hash(dto.password, 12)
      : existingUser.password;

    const result = await this.databaseService.query<UserRow>(
      `
      UPDATE phar_users
      SET
        full_name = COALESCE($1, full_name),
        email = COALESCE($2, email),
        phone = COALESCE($3, phone),
        role = COALESCE($4, role),
        shop_id = COALESCE($5::uuid, shop_id),
        branch_id = COALESCE($6::uuid, branch_id),
        status = COALESCE($7::boolean, status),
        is_verified = COALESCE($8::boolean, is_verified),
        password = $9
      WHERE id = $10::uuid
      RETURNING *
      `,
      [
        dto.fullName ?? null,
        dto.email ? nextEmail : null,
        dto.phone ?? null,
        dto.role ?? null,
        dto.shopId ?? null,
        dto.branchId ?? null,
        dto.status ?? null,
        dto.isVerified ?? null,
        nextPassword,
        id,
      ],
    );

    return this.mapUser(result.rows[0]);
  }

  async softDeleteUserById(id: string) {
    await this.findUserByIdOrThrow(id);

    await this.databaseService.query(
      `
      UPDATE phar_users
      SET
        is_delete = TRUE,
        status = FALSE,
        refresh_token_hash = NULL,
        refresh_token_expires_at = NULL
      WHERE id = $1::uuid
      `,
      [id],
    );

    return {
      message: 'User soft deleted successfully',
    };
  }

  async permanentDeleteUserById(id: string) {
    await this.findUserByIdOrThrow(id, true);

    try {
      await this.databaseService.query(
        `
        DELETE FROM phar_users
        WHERE id = $1::uuid
        `,
        [id],
      );
    } catch (error: unknown) {
      const code =
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        typeof (error as { code?: string }).code === 'string'
          ? (error as { code: string }).code
          : null;

      if (code === '23503') {
        throw new UnprocessableEntityException(
          'Cannot permanently delete user because related records exist',
        );
      }

      throw error;
    }

    return {
      message: 'User permanently deleted successfully',
    };
  }

  async restoreSoftDeletedUser(id: string) {
    await this.findUserByIdOrThrow(id, true);

    await this.databaseService.query(
      `
      UPDATE phar_users
      SET
        is_delete = FALSE,
        status = TRUE
      WHERE id = $1::uuid
      `,
      [id],
    );

    return {
      message: 'User restored successfully',
    };
  }

  async updatePassword(dto: UpdatePasswordDto) {
    const user = await this.findUserByIdOrThrow(dto.userId);

    const isPasswordMatched = await compare(dto.currentPassword, user.password);
    if (!isPasswordMatched) {
      throw new BadRequestException('Current password is incorrect');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    const newPasswordHash = await hash(dto.newPassword, 12);
    await this.databaseService.query(
      `
      UPDATE phar_users
      SET
        password = $1,
        refresh_token_hash = NULL,
        refresh_token_expires_at = NULL
      WHERE id = $2::uuid
      `,
      [newPasswordHash, user.id],
    );

    return {
      message: 'Password updated successfully',
    };
  }

  private async findUserByIdOrThrow(id: string, includeDeleted = false) {
    const result = await this.databaseService.query<UserRow>(
      `
      SELECT *
      FROM phar_users
      WHERE id = $1::uuid
        AND ($2::boolean = TRUE OR is_delete = FALSE)
      LIMIT 1
      `,
      [id, includeDeleted],
    );

    const user = result.rows[0];
    if (!user) {
      throw new NotFoundException(`User not found for id: ${id}`);
    }

    return user;
  }

  private async ensureEmailNotUsed(email: string, ignoreUserId?: string) {
    const result = await this.databaseService.query<{ id: string }>(
      `
      SELECT id
      FROM phar_users
      WHERE LOWER(email) = LOWER($1)
        AND ($2::uuid IS NULL OR id <> $2::uuid)
      LIMIT 1
      `,
      [email, ignoreUserId ?? null],
    );

    if (result.rows[0]) {
      throw new BadRequestException('Email already registered');
    }
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private mapUser(row: UserRow) {
    return {
      id: row.id,
      shopId: row.shop_id,
      branchId: row.branch_id,
      role: row.role,
      fullName: row.full_name,
      email: row.email,
      phone: row.phone,
      status: row.status,
      isDelete: row.is_delete,
      isVerified: row.is_verified,
      lastLoginAt: row.last_login_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
