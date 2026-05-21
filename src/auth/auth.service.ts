import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { QueryResultRow } from 'pg';
import { DatabaseService } from '../database/database.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { ResendVerificationEmailDto } from './dto/resend-verification-email.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { VerifyResetCodeDto } from './dto/verify-reset-code.dto';

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
  last_login_at: string | null;
  created_at: string;
};

type JwtPayload = {
  sub: string;
  email: string;
  role: string;
  type: 'access' | 'refresh';
};

@Injectable()
export class AuthService {
  private readonly jwtSecret =
    process.env.JWT_SECRET?.trim() || 'change-me-in-production';
  private readonly jwtRefreshSecret =
    process.env.JWT_REFRESH_SECRET?.trim() || this.jwtSecret;
  private readonly accessTokenExpiresIn = process.env.JWT_EXPIRATION || '15m';
  private readonly refreshTokenExpiresIn =
    process.env.JWT_REFRESH_EXPIRATION || '7d';
  private readonly accessTokenExpiresInSeconds = Math.floor(
    (this.parseDurationToMs(this.accessTokenExpiresIn) ?? 15 * 60 * 1000) /
      1000,
  );
  private readonly refreshTokenExpiresInSeconds = Math.floor(
    (this.parseDurationToMs(this.refreshTokenExpiresIn) ??
      7 * 24 * 60 * 60 * 1000) /
      1000,
  );
  private readonly resetCodeTtlMinutes = Number(
    process.env.PASSWORD_RESET_CODE_TTL_MINUTES || 15,
  );
  private readonly exposeInternalTokens =
    (process.env.NODE_ENV || 'development') !== 'production';

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const email = this.normalizeEmail(dto.email);

    const existingUser = await this.findUserByEmail(email);
    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    const passwordHash = await hash(dto.password, 12);
    const verificationToken = this.generateToken(32);

    const result = await this.databaseService.query<UserRow>(
      `
      INSERT INTO phar_users (
        shop_id, branch_id, role, full_name, email, phone, password,
        is_verified, verification_token
      )
      VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, FALSE, $8)
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
        verificationToken,
      ],
    );

    const user = result.rows[0];
    const response: Record<string, unknown> = {
      message: 'Registration successful. Verify your email to continue.',
      user: this.toPublicUser(user),
    };

    if (this.exposeInternalTokens) {
      response.verificationToken = verificationToken;
    }

    return response;
  }

  async login(dto: LoginDto) {
    const email = this.normalizeEmail(dto.email);
    const user = await this.findUserByEmail(email);

    if (!user || !user.status) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatched = await compare(dto.password, user.password);
    if (!passwordMatched) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.is_verified) {
      throw new UnauthorizedException('Email is not verified');
    }

    const tokens = await this.signTokens(user);
    const refreshExpiry = this.computeRefreshTokenExpiryDate(
      this.refreshTokenExpiresIn,
    );

    await this.databaseService.query(
      `
      UPDATE phar_users
      SET
        refresh_token_hash = $1,
        refresh_token_expires_at = $2::timestamptz,
        last_login_at = now()
      WHERE id = $3::uuid
      `,
      [this.sha256(tokens.refreshToken), refreshExpiry.toISOString(), user.id],
    );

    return {
      message: 'Login successful',
      user: this.toPublicUser(user),
      tokens,
    };
  }

  async refresh(dto: RefreshTokenDto) {
    const payload = await this.verifyRefreshToken(dto.refreshToken);
    const user = await this.findUserById(payload.sub);

    if (!user || !user.status) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (!user.refresh_token_hash) {
      throw new UnauthorizedException('Refresh session not found');
    }

    const hashedIncoming = this.sha256(dto.refreshToken);
    if (user.refresh_token_hash !== hashedIncoming) {
      throw new UnauthorizedException('Refresh token mismatch');
    }

    if (
      user.refresh_token_expires_at &&
      new Date(user.refresh_token_expires_at).getTime() <= Date.now()
    ) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const tokens = await this.signTokens(user);
    const refreshExpiry = this.computeRefreshTokenExpiryDate(
      this.refreshTokenExpiresIn,
    );

    await this.databaseService.query(
      `
      UPDATE phar_users
      SET
        refresh_token_hash = $1,
        refresh_token_expires_at = $2::timestamptz
      WHERE id = $3::uuid
      `,
      [this.sha256(tokens.refreshToken), refreshExpiry.toISOString(), user.id],
    );

    return {
      message: 'Token refreshed',
      tokens,
    };
  }

  async logout(refreshToken: string) {
    let userId: string | null = null;

    try {
      const payload = await this.verifyRefreshToken(refreshToken);
      userId = payload.sub;
    } catch {
      return {
        message: 'Logout successful',
      };
    }

    await this.databaseService.query(
      `
      UPDATE phar_users
      SET
        refresh_token_hash = NULL,
        refresh_token_expires_at = NULL
      WHERE id = $1::uuid
      `,
      [userId],
    );

    return {
      message: 'Logout successful',
    };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const result = await this.databaseService.query<UserRow>(
      `
      UPDATE phar_users
      SET
        is_verified = TRUE,
        verification_token = NULL
      WHERE verification_token = $1 AND is_verified = FALSE
      RETURNING *
      `,
      [dto.token],
    );

    const user = result.rows[0];
    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    return {
      message: 'Email verified successfully',
      user: this.toPublicUser(user),
    };
  }

  async resendVerificationEmail(dto: ResendVerificationEmailDto) {
    const email = this.normalizeEmail(dto.email);
    const user = await this.findUserByEmail(email);

    if (!user) {
      return {
        message:
          'If that email exists, a verification email has been dispatched.',
      };
    }

    if (user.is_verified) {
      return {
        message: 'Email is already verified',
      };
    }

    const verificationToken = this.generateToken(32);
    await this.databaseService.query(
      `
      UPDATE phar_users
      SET verification_token = $1
      WHERE id = $2::uuid
      `,
      [verificationToken, user.id],
    );

    const response: Record<string, unknown> = {
      message: 'Verification email resent',
    };

    if (this.exposeInternalTokens) {
      response.verificationToken = verificationToken;
    }

    return response;
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = this.normalizeEmail(dto.email);
    const user = await this.findUserByEmail(email);

    if (!user) {
      return {
        message: 'If that email exists, a reset code has been sent.',
      };
    }

    const code = this.generateResetCode();
    const ttlMinutes = Number.isFinite(this.resetCodeTtlMinutes)
      ? this.resetCodeTtlMinutes
      : 15;

    await this.databaseService.query(
      `
      UPDATE phar_users
      SET
        password_reset_code = $1,
        password_reset_code_expires_at = now() + make_interval(mins => $2::int),
        password_reset_verified_at = NULL
      WHERE id = $3::uuid
      `,
      [code, ttlMinutes, user.id],
    );

    const response: Record<string, unknown> = {
      message: 'If that email exists, a reset code has been sent.',
    };

    if (this.exposeInternalTokens) {
      response.resetCode = code;
    }

    return response;
  }

  async verifyResetCode(dto: VerifyResetCodeDto) {
    const email = this.normalizeEmail(dto.email);
    const result = await this.databaseService.query<UserRow>(
      `
      UPDATE phar_users
      SET password_reset_verified_at = now()
      WHERE email = $1
        AND password_reset_code = $2
        AND password_reset_code_expires_at IS NOT NULL
        AND password_reset_code_expires_at > now()
      RETURNING *
      `,
      [email, dto.code],
    );

    if (!result.rows[0]) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    return {
      message: 'Reset code verified',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const email = this.normalizeEmail(dto.email);
    const userResult = await this.databaseService.query<UserRow>(
      `
      SELECT *
      FROM phar_users
      WHERE email = $1
      LIMIT 1
      `,
      [email],
    );

    const user = userResult.rows[0];
    if (!user) {
      throw new BadRequestException('Invalid request');
    }

    const isCodeValid =
      user.password_reset_code === dto.code &&
      user.password_reset_code_expires_at !== null &&
      new Date(user.password_reset_code_expires_at).getTime() > Date.now();

    if (!isCodeValid || !user.password_reset_verified_at) {
      throw new BadRequestException(
        'Reset code is invalid, expired, or not verified',
      );
    }

    const newPasswordHash = await hash(dto.newPassword, 12);

    await this.databaseService.query(
      `
      UPDATE phar_users
      SET
        password = $1,
        password_reset_code = NULL,
        password_reset_code_expires_at = NULL,
        password_reset_verified_at = NULL,
        refresh_token_hash = NULL,
        refresh_token_expires_at = NULL
      WHERE id = $2::uuid
      `,
      [newPasswordHash, user.id],
    );

    return {
      message: 'Password reset successful',
    };
  }

  private async findUserByEmail(email: string) {
    const result = await this.databaseService.query<UserRow>(
      `
      SELECT *
      FROM phar_users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
      `,
      [email],
    );

    return result.rows[0] ?? null;
  }

  private async findUserById(id: string) {
    const result = await this.databaseService.query<UserRow>(
      `
      SELECT *
      FROM phar_users
      WHERE id = $1::uuid
      LIMIT 1
      `,
      [id],
    );

    return result.rows[0] ?? null;
  }

  private async signTokens(user: UserRow) {
    const payload: Omit<JwtPayload, 'type'> = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(
      { ...payload, type: 'access' },
      {
        secret: this.jwtSecret,
        expiresIn: this.accessTokenExpiresInSeconds,
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      { ...payload, type: 'refresh' },
      {
        secret: this.jwtRefreshSecret,
        expiresIn: this.refreshTokenExpiresInSeconds,
      },
    );

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      accessTokenExpiresIn: this.accessTokenExpiresIn,
      refreshTokenExpiresIn: this.refreshTokenExpiresIn,
    };
  }

  private async verifyRefreshToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.jwtRefreshSecret,
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private generateToken(byteLength: number) {
    return randomBytes(byteLength).toString('hex');
  }

  private generateResetCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  private sha256(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }

  private computeRefreshTokenExpiryDate(expiryText: string) {
    const fallback = 7 * 24 * 60 * 60 * 1000;
    const ms = this.parseDurationToMs(expiryText) ?? fallback;
    return new Date(Date.now() + ms);
  }

  private parseDurationToMs(value: string) {
    const trimmed = value.trim();
    const directNumber = Number(trimmed);
    if (Number.isFinite(directNumber)) {
      return directNumber * 1000;
    }

    const match = trimmed.match(/^(\d+)\s*([smhd])$/i);
    if (!match) return null;

    const amount = Number(match[1]);
    const unit = match[2].toLowerCase();
    if (!Number.isFinite(amount)) return null;

    const multiplierMap: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return amount * multiplierMap[unit];
  }

  private toPublicUser(user: UserRow) {
    return {
      id: user.id,
      shopId: user.shop_id,
      branchId: user.branch_id,
      role: user.role,
      fullName: user.full_name,
      email: user.email,
      phone: user.phone,
      status: user.status,
      isVerified: user.is_verified,
      lastLoginAt: user.last_login_at,
      createdAt: user.created_at,
    };
  }
}
